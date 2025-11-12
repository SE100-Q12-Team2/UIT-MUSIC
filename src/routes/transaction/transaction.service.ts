import { Injectable, Logger } from '@nestjs/common'
import { TransactionRepository } from './transaction.repo'
import { SepayGatewayService } from './sepay-gateway.service'
import { CreateTransactionDto, QueryTransactionDto, RefundTransactionDto, SepayWebhookDto } from './transaction.dto'
import {
  TransactionNotFoundError,
  InvalidTransactionStatusError,
  InvalidRefundAmountError,
  TransactionAlreadyRefundedError,
  SubscriptionNotFoundForTransactionError,
  PaymentMethodNotFoundForTransactionError,
} from './transaction.error'
import { TransactionStatus } from '@prisma/client'
import { isNotFoundPrismaError } from 'src/shared/lib'

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name)

  constructor(
    private readonly repository: TransactionRepository,
    private readonly sepayGateway: SepayGatewayService,
  ) {}

  async create(userId: number, data: CreateTransactionDto) {
    if (data.subscriptionId) {
      const subscription = await this.repository.findSubscriptionById(data.subscriptionId)
      if (!subscription) {
        throw SubscriptionNotFoundForTransactionError(data.subscriptionId)
      }
    }

    const paymentMethod = await this.repository.findPaymentMethodById(data.paymentMethodId)
    if (!paymentMethod) {
      throw PaymentMethodNotFoundForTransactionError(data.paymentMethodId)
    }

    const transaction = await this.repository.create({
      userId,
      subscriptionId: data.subscriptionId,
      amount: data.amount,
      paymentMethodId: data.paymentMethodId,
      transactionStatus: TransactionStatus.Pending,
    })

    const txnRef = `TXN${transaction.id}_${Date.now()}`

    await this.repository.updateStatus(transaction.id, {
      transactionStatus: TransactionStatus.Pending,
      transactionReference: txnRef,
    })

    const paymentContent = data.subscriptionId
      ? `Thanh toan subscription #${data.subscriptionId}`
      : `Nap tien #${transaction.id}`

    const qrPayment = await this.sepayGateway.createPaymentQR(txnRef, data.amount, paymentContent)

    this.logger.log(`Created SePay QR payment for transaction ${transaction.id}`)

    return {
      ...qrPayment,
      transactionId: transaction.id,
      txnRef,
    }
  }

  async findAll(query: QueryTransactionDto) {
    return this.repository.findAll(query)
  }

  async findById(id: number) {
    const transaction = await this.repository.findById(id)
    if (!transaction) {
      throw TransactionNotFoundError(id)
    }
    return transaction
  }

  async getUserTransactions(userId: number, page: number = 1, limit: number = 10) {
    return this.repository.findByUserId(userId, page, limit)
  }

  async refund(id: number, data: RefundTransactionDto) {
    const transaction = await this.findById(id)

    if (transaction.transactionStatus === TransactionStatus.Refunded) {
      throw TransactionAlreadyRefundedError(id)
    }

    if (transaction.transactionStatus !== TransactionStatus.Completed) {
      throw InvalidTransactionStatusError(transaction.transactionStatus, 'refund')
    }

    const refundAmount = data.amount || transaction.amount
    if (refundAmount > transaction.amount) {
      throw InvalidRefundAmountError(refundAmount, transaction.amount)
    }

    try {
      const existingInvoiceData = transaction.invoiceData as Record<string, any> | null
      const refundInvoiceData = {
        ...(existingInvoiceData && typeof existingInvoiceData === 'object' ? existingInvoiceData : {}),
        refund: {
          amount: refundAmount,
          reason: data.reason,
          refundedAt: new Date().toISOString(),
        },
      }

      const updatedTransaction = await this.repository.updateStatus(id, {
        transactionStatus: TransactionStatus.Refunded,
        invoiceData: refundInvoiceData,
      })

      if (transaction.subscriptionId) {
        await this.repository.updateSubscriptionStatus(transaction.subscriptionId, false)
        this.logger.log(`Deactivated subscription ${transaction.subscriptionId} due to refund`)
      }

      this.logger.log(`Refunded transaction ${id}: ${refundAmount} VND`)

      return updatedTransaction
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw TransactionNotFoundError(id)
      }
      throw error
    }
  }

  async getStats() {
    return this.repository.getStats()
  }

  async processSepayCallback(webhookData: SepayWebhookDto, signature?: string) {
    try {
      if (signature) {
        const payload = JSON.stringify(webhookData)
        const isValid = this.sepayGateway.verifyWebhookSignature(payload, signature)
        if (!isValid) {
          throw new Error('Invalid SePay webhook signature')
        }
      }

      const result = this.sepayGateway.processWebhook(webhookData)

      const transaction = await this.repository.findByReference(result.txnRef)
      if (!transaction) {
        this.logger.error(`Transaction not found for txnRef: ${result.txnRef}`)
        throw new Error(`Transaction not found: ${result.txnRef}`)
      }

      if (transaction.transactionStatus !== TransactionStatus.Pending) {
        this.logger.warn(
          `Transaction ${transaction.id} already processed with status: ${transaction.transactionStatus}`,
        )
        return transaction
      }

      const newStatus = result.isSuccess ? TransactionStatus.Completed : TransactionStatus.Failed

      const invoiceData = {
        transactionId: result.transactionId,
        transferDate: result.transferDate,
        description: result.description,
        amount: result.amount,
        paymentGateway: 'sepay',
      }

      const updatedTransaction = await this.repository.updateStatus(transaction.id, {
        transactionStatus: newStatus,
        invoiceData,
      })

      if (result.isSuccess && transaction.subscriptionId) {
        await this.repository.updateSubscriptionStatus(transaction.subscriptionId, true)
        this.logger.log(`Activated subscription ${transaction.subscriptionId} for transaction ${transaction.id}`)
      }

      this.logger.log(`Processed SePay callback for transaction ${transaction.id}: ${newStatus}`)

      return updatedTransaction
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error processing SePay callback: ${err.message}`, err.stack)
      throw error
    }
  }
}
