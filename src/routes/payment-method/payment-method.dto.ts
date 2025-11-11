import { createZodDto } from 'nestjs-zod'
import {
  CreatePaymentMethodSchema,
  UpdatePaymentMethodSchema,
  QueryPaymentMethodSchema,
  PaymentMethodResponseSchema,
  PaymentMethodListResponseSchema,
  PaymentMethodStatsResponseSchema,
} from './payment-method.model'

export class CreatePaymentMethodDto extends createZodDto(CreatePaymentMethodSchema) {}
export class UpdatePaymentMethodDto extends createZodDto(UpdatePaymentMethodSchema) {}
export class QueryPaymentMethodDto extends createZodDto(QueryPaymentMethodSchema) {}

export class PaymentMethodResponseDto extends createZodDto(PaymentMethodResponseSchema) {}
export class PaymentMethodListResponseDto extends createZodDto(PaymentMethodListResponseSchema) {}
export class PaymentMethodStatsResponseDto extends createZodDto(PaymentMethodStatsResponseSchema) {}
