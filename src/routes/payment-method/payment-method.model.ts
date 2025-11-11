import { z } from 'zod'

export const PaymentMethodSchema = z.object({
  id: z.number().int().positive(),
  methodName: z.string().max(100),
  isActive: z.boolean(),
})

export const CreatePaymentMethodSchema = z.object({
  methodName: z.string().min(1, 'Method name is required').max(100, 'Method name must not exceed 100 characters'),
  isActive: z.boolean().optional().default(true),
})

export const UpdatePaymentMethodSchema = z
  .object({
    methodName: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

export const QueryPaymentMethodSchema = z.object({
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
  isActive: z
    .string()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined))
    .optional(),
  search: z.string().optional(),
})

export const PaymentMethodResponseSchema = PaymentMethodSchema

export const PaymentMethodListResponseSchema = z.object({
  data: z.array(PaymentMethodResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export const PaymentMethodStatsResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
})

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type CreatePaymentMethodDto = z.infer<typeof CreatePaymentMethodSchema>
export type UpdatePaymentMethodDto = z.infer<typeof UpdatePaymentMethodSchema>
export type QueryPaymentMethodDto = z.infer<typeof QueryPaymentMethodSchema>
export type PaymentMethodResponse = z.infer<typeof PaymentMethodResponseSchema>
export type PaymentMethodListResponse = z.infer<typeof PaymentMethodListResponseSchema>
export type PaymentMethodStatsResponse = z.infer<typeof PaymentMethodStatsResponseSchema>
