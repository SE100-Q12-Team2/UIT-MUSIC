import { createZodDto } from 'nestjs-zod'
import {
  CreateTransactionSchema,
  UpdateTransactionStatusSchema,
  QueryTransactionSchema,
  RefundTransactionSchema,
  TransactionResponseSchema,
  TransactionListResponseSchema,
  TransactionStatsResponseSchema,
  SepayCreatePaymentSchema,
  SepayWebhookSchema,
  SepayPaymentQRResponseSchema,
} from './transaction.model'

export class CreateTransactionDto extends createZodDto(CreateTransactionSchema) {}
export class UpdateTransactionStatusDto extends createZodDto(UpdateTransactionStatusSchema) {}
export class QueryTransactionDto extends createZodDto(QueryTransactionSchema) {}
export class RefundTransactionDto extends createZodDto(RefundTransactionSchema) {}
export class SepayCreatePaymentDto extends createZodDto(SepayCreatePaymentSchema) {}
export class SepayWebhookDto extends createZodDto(SepayWebhookSchema) {}

export class TransactionResponseDto extends createZodDto(TransactionResponseSchema) {}
export class TransactionListResponseDto extends createZodDto(TransactionListResponseSchema) {}
export class TransactionStatsResponseDto extends createZodDto(TransactionStatsResponseSchema) {}
export class SepayPaymentQRResponseDto extends createZodDto(SepayPaymentQRResponseSchema) {}
