import { Injectable, Logger } from '@nestjs/common'
import * as crypto from 'crypto'
import { PaymentProcessingError, InvalidSepaySignatureError } from './transaction.error'

/**
 * SePay Gateway Service
 * Handles integration with SePay payment gateway
 * Documentation: https://my.sepay.vn/userapi/documents/id/4
 */
@Injectable()
export class SepayGatewayService {
  private readonly logger = new Logger(SepayGatewayService.name)
  private readonly sepayApiUrl: string
  private readonly sepayAccountNumber: string
  private readonly sepayAccountName: string
  private readonly sepaySyncUrl: string
  private readonly sepayApiKey: string
  private readonly sepayWebhookSecret: string

  constructor() {
    this.sepayApiUrl = process.env.SEPAY_API_URL || 'https://my.sepay.vn/userapi'
    this.sepayAccountNumber = process.env.SEPAY_ACCOUNT_NUMBER || ''
    this.sepayAccountName = process.env.SEPAY_ACCOUNT_NAME || ''
    this.sepaySyncUrl = process.env.SEPAY_SYNC_URL || ''
    this.sepayApiKey = process.env.SEPAY_API_KEY || ''
    this.sepayWebhookSecret = process.env.SEPAY_WEBHOOK_SECRET || ''

    if (!this.sepayAccountNumber || !this.sepayAccountName || !this.sepayApiKey) {
      this.logger.warn(
        'SePay credentials not configured. Please set SEPAY_ACCOUNT_NUMBER, SEPAY_ACCOUNT_NAME, and SEPAY_API_KEY environment variables.',
      )
    }
  }

  async createPaymentQR(
    txnRef: string,
    amount: number,
    content: string,
  ): Promise<{
    qrCodeUrl: string
    accountNumber: string
    accountName: string
    amount: number
    content: string
    bankName: string
  }> {
    try {
      const roundedAmount = Math.round(amount)

      const paymentContent = `${content} ${txnRef}`

      const qrData = {
        accountNumber: this.sepayAccountNumber,
        accountName: this.sepayAccountName,
        amount: roundedAmount,
        content: paymentContent,
        bankName: 'VietinBank',
      }

      const qrCodeUrl = this.generateVietQRUrl(
        qrData.accountNumber,
        qrData.accountName,
        qrData.amount,
        qrData.content,
        qrData.bankName,
      )

      this.logger.log(`Created SePay QR code for txnRef: ${txnRef}, amount: ${roundedAmount}`)

      return {
        qrCodeUrl,
        accountNumber: qrData.accountNumber,
        accountName: qrData.accountName,
        amount: roundedAmount,
        content: paymentContent,
        bankName: qrData.bankName,
      }
    } catch (error) {
      this.logger.error(`Error creating SePay QR code: ${error.message}`, error.stack)
      throw PaymentProcessingError(`Failed to create QR payment: ${error.message}`)
    }
  }

  private generateVietQRUrl(
    accountNumber: string,
    accountName: string,
    amount: number,
    content: string,
    bankCode: string,
  ): string {
    const baseUrl = 'https://img.vietqr.io/image'
    const template = 'compact'

    const qrUrl = `${baseUrl}/${bankCode}-${accountNumber}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`

    return qrUrl
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      if (!this.sepayWebhookSecret) {
        this.logger.warn('SePay webhook secret not configured')
        return false
      }

      const expectedSignature = crypto.createHmac('sha256', this.sepayWebhookSecret).update(payload).digest('hex')

      const isValid = signature === expectedSignature
      this.logger.log(`SePay webhook signature verification: ${isValid ? 'SUCCESS' : 'FAILED'}`)

      return isValid
    } catch (error) {
      this.logger.error(`Error verifying SePay webhook signature: ${error.message}`, error.stack)
      return false
    }
  }


  processWebhook(webhookData: any): {
    txnRef: string
    amount: number
    transactionId: string
    transferDate: string
    description: string
    isSuccess: boolean
  } {
    try {
      const description = webhookData.transferContent || webhookData.description || ''
      const txnRefMatch = description.match(/TXN\d+_\d+/)

      if (!txnRefMatch) {
        throw new Error('Transaction reference not found in webhook data')
      }

      const txnRef = txnRefMatch[0]
      const amount = parseFloat(webhookData.transferAmount || webhookData.amount || '0')
      const transactionId = webhookData.transactionId || webhookData.id || ''
      const transferDate = webhookData.transferDate || webhookData.when || new Date().toISOString()

      const isSuccess = amount > 0

      this.logger.log(`SePay webhook processed - TxnRef: ${txnRef}, Amount: ${amount}, TransactionId: ${transactionId}`)

      return {
        txnRef,
        amount,
        transactionId,
        transferDate,
        description,
        isSuccess,
      }
    } catch (error) {
      this.logger.error(`Error processing SePay webhook: ${error.message}`, error.stack)
      throw PaymentProcessingError(`Failed to process webhook: ${error.message}`)
    }
  }


  async checkTransactionStatus(
    txnRef: string,
    fromDate: string,
    toDate: string,
  ): Promise<{ found: boolean; amount?: number; transactionId?: string; date?: string }> {
    try {
      if (!this.sepayApiKey) {
        throw new Error('SePay API key not configured')
      }

      // Call SePay API to get transaction list
      const response = await fetch(`${this.sepayApiUrl}/transactions`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.sepayApiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`SePay API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const transactions = data.transactions || []

      // Find transaction by content containing txnRef
      const transaction = transactions.find((t: any) => {
        const content = t.transferContent || t.description || ''
        return content.includes(txnRef)
      })

      if (transaction) {
        return {
          found: true,
          amount: parseFloat(transaction.transferAmount || transaction.amount || '0'),
          transactionId: transaction.transactionId || transaction.id,
          date: transaction.transferDate || transaction.when,
        }
      }

      return { found: false }
    } catch (error) {
      this.logger.error(`Error checking SePay transaction status: ${error.message}`, error.stack)
      throw PaymentProcessingError(`Failed to check transaction status: ${error.message}`)
    }
  }

  /**
   * Get account balance from SePay API
   */
  async getAccountBalance(): Promise<{ balance: number; currency: string }> {
    try {
      if (!this.sepayApiKey) {
        throw new Error('SePay API key not configured')
      }

      const response = await fetch(`${this.sepayApiUrl}/balance`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.sepayApiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`SePay API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      return {
        balance: parseFloat(data.balance || '0'),
        currency: 'VND',
      }
    } catch (error) {
      this.logger.error(`Error getting SePay account balance: ${error.message}`, error.stack)
      throw PaymentProcessingError(`Failed to get account balance: ${error.message}`)
    }
  }
}
