import { z } from 'zod'

export const SubscriptionPlanSchema = z.object({
  id: z.number(),
  planName: z.string(),
  durationMonths: z.number(),
  price: z.number(),
  features: z.any().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
})

export const CreateSubscriptionPlanSchema = z
  .object({
    planName: z.string().min(1).max(100),
    durationMonths: z.number().int().positive(),
    price: z.number().min(0),
    features: z.record(z.string(), z.any()).optional(),
    isActive: z.boolean().default(true),
  })
  .strict()

export const UpdateSubscriptionPlanSchema = z
  .object({
    planName: z.string().min(1).max(100).optional(),
    durationMonths: z.number().int().positive().optional(),
    price: z.number().min(0).optional(),
    features: z.record(z.string(), z.any()).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

export const GetSubscriptionPlansQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    isActive: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined || val === '') return undefined
        if (val === 'true') return true
        if (val === 'false') return false
        return undefined
      }),
    search: z.string().optional(),
  })
  .strict()

export const SubscriptionPlanResponseSchema = SubscriptionPlanSchema

export const PaginatedSubscriptionPlansResponseSchema = z.object({
  data: z.array(SubscriptionPlanResponseSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const SubscriptionPlanStatsSchema = z.object({
  totalPlans: z.number(),
  activePlans: z.number(),
  inactivePlans: z.number(),
  totalSubscribers: z.number(),
  averagePrice: z.number(),
  planDistribution: z.array(
    z.object({
      planId: z.number(),
      planName: z.string(),
      subscriberCount: z.number(),
      percentage: z.number(),
    }),
  ),
})

export type SubscriptionPlanType = z.infer<typeof SubscriptionPlanSchema>
export type CreateSubscriptionPlanType = z.infer<typeof CreateSubscriptionPlanSchema>
export type UpdateSubscriptionPlanType = z.infer<typeof UpdateSubscriptionPlanSchema>
export type GetSubscriptionPlansQueryType = z.infer<typeof GetSubscriptionPlansQuerySchema>
export type SubscriptionPlanResponseType = z.infer<typeof SubscriptionPlanResponseSchema>
export type PaginatedSubscriptionPlansResponseType = z.infer<typeof PaginatedSubscriptionPlansResponseSchema>
export type SubscriptionPlanStatsType = z.infer<typeof SubscriptionPlanStatsSchema>
