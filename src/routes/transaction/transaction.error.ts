import { NotFoundException, BadRequestException } from '@nestjs/common'

export const TransactionNotFoundError = (id: number) =>
  new NotFoundException([
    {
      path: ['id'],
      message: `Transaction with ID ${id} not found`,
    },
  ])

export const InvalidTransactionStatusError = (currentStatus: string, operation: string) =>
  new BadRequestException([
    {
      path: ['transactionStatus'],
      message: `Cannot ${operation} transaction with status ${currentStatus}`,
    },
  ])

export const PaymentProcessingError = (message: string) =>
  new BadRequestException([
    {
      path: ['payment'],
      message: `Payment processing failed: ${message}`,
    },
  ])

export const InvalidRefundAmountError = (refundAmount: number, transactionAmount: number) =>
  new BadRequestException([
    {
      path: ['amount'],
      message: `Refund amount ${refundAmount} exceeds transaction amount ${transactionAmount}`,
    },
  ])

export const TransactionAlreadyRefundedError = (id: number) =>
  new BadRequestException([
    {
      path: ['id'],
      message: `Transaction with ID ${id} has already been refunded`,
    },
  ])

export const SubscriptionNotFoundForTransactionError = (subscriptionId: number) =>
  new NotFoundException([
    {
      path: ['subscriptionId'],
      message: `Subscription with ID ${subscriptionId} not found`,
    },
  ])

export const PaymentMethodNotFoundForTransactionError = (paymentMethodId: number) =>
  new NotFoundException([
    {
      path: ['paymentMethodId'],
      message: `Payment method with ID ${paymentMethodId} not found`,
    },
  ])

export const InvalidSepaySignatureError = () =>
  new BadRequestException([
    {
      path: ['signature'],
      message: 'Invalid SePay webhook signature',
    },
  ])

export const SepayPaymentFailedError = (message: string) =>
  new BadRequestException([
    {
      path: ['sepay'],
      message: `SePay payment failed: ${message}`,
    },
  ])
