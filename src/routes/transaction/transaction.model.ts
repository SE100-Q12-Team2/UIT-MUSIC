import { z } from 'zod'
import { TransactionStatus } from '@prisma/client'

export const TransactionStatusEnum = z.enum(TransactionStatus)

export const TransactionSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  subscriptionId: z.number().int().positive().nullable(),
  amount: z.number().positive(),
  paymentMethodId: z.number().int().positive(),
  transactionStatus: TransactionStatusEnum,
  transactionReference: z.string().nullable(),
  invoiceData: z.any().nullable(),
  createdAt: z.date(),
})

export const CreateTransactionSchema = z.object({
  subscriptionId: z.number().int().positive().optional(),
  amount: z.number().positive(),
  paymentMethodId: z.number().int().positive(),
  returnUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const UpdateTransactionStatusSchema = z
  .object({
    transactionStatus: TransactionStatusEnum,
    transactionReference: z.string().optional(),
    invoiceData: z.any().optional(),
  })
  .strict()

export const QueryTransactionSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  status: z.enum(['Pending', 'Completed', 'Failed', 'Refunded']).optional(),
  userId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  subscriptionId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

export const RefundTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().min(10).max(500),
})

export const TransactionResponseSchema = TransactionSchema.extend({
  user: z
    .object({
      id: z.number(),
      email: z.string(),
      fullName: z.string(),
    })
    .optional(),
  subscription: z
    .object({
      id: z.number(),
      planId: z.number(),
    })
    .optional(),
  paymentMethod: z
    .object({
      id: z.number(),
      methodName: z.string(),
    })
    .optional(),
})

export const TransactionListResponseSchema = z.object({
  data: z.array(TransactionResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export const TransactionStatsResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  refunded: z.number().int().nonnegative(),
  totalAmount: z.number().nonnegative(),
  completedAmount: z.number().nonnegative(),
  refundedAmount: z.number().nonnegative(),
})

export const VNPayPaymentUrlResponseSchema = z.object({
  paymentUrl: z.string().url(),
  transactionId: z.number().int().positive(),
  txnRef: z.string(),
})

export const SepayCreatePaymentSchema = z.object({
  amount: z.number().positive(),
  content: z.string(),
})

export const SepayWebhookSchema = z.object({
  id: z.string().optional(),
  transactionId: z.string().optional(),
  transferAmount: z.union([z.string(), z.number()]).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  transferContent: z.string().optional(),
  description: z.string().optional(),
  transferDate: z.string().optional(),
  when: z.string().optional(),
  accountNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  subAccount: z.string().optional(),
})

export const SepayPaymentQRResponseSchema = z.object({
  qrCodeUrl: z.string().url(),
  accountNumber: z.string(),
  accountName: z.string(),
  amount: z.number().positive(),
  content: z.string(),
  bankName: z.string(),
  transactionId: z.number().int().positive(),
  txnRef: z.string(),
})

export type Transaction = z.infer<typeof TransactionSchema>
export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>
export type UpdateTransactionStatusDto = z.infer<typeof UpdateTransactionStatusSchema>
export type QueryTransactionDto = z.infer<typeof QueryTransactionSchema>
export type RefundTransactionDto = z.infer<typeof RefundTransactionSchema>
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>
export type TransactionListResponse = z.infer<typeof TransactionListResponseSchema>
export type TransactionStatsResponse = z.infer<typeof TransactionStatsResponseSchema>
export type SepayCreatePaymentDto = z.infer<typeof SepayCreatePaymentSchema>
export type SepayWebhookDto = z.infer<typeof SepayWebhookSchema>
export type SepayPaymentQRResponse = z.infer<typeof SepayPaymentQRResponseSchema>
