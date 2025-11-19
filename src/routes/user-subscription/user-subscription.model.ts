import { z } from 'zod'

export const UserSubscriptionSchema = z.object({
  id: z.number(),
  userId: z.number(),
  planId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
  autoRenew: z.boolean(),
  createdAt: z.string(),
})

export const CreateUserSubscriptionSchema = z
  .object({
    planId: z.number().int().positive(),
    autoRenew: z.boolean().default(false),
  })
  .strict()

export const UpdateUserSubscriptionSchema = z
  .object({
    autoRenew: z.boolean().optional(),
  })
  .strict()

export const GetUserSubscriptionsQuerySchema = z
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
    planId: z.coerce.number().int().positive().optional(),
  })
  .strict()

export const UserSubscriptionResponseSchema = UserSubscriptionSchema.extend({
  plan: z.object({
    id: z.number(),
    planName: z.string(),
    durationMonths: z.number(),
    price: z.number(),
    features: z.any().nullable(),
  }),
})

export const PaginatedUserSubscriptionsResponseSchema = z.object({
  data: z.array(UserSubscriptionResponseSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const CancelSubscriptionResponseSchema = z.object({
  message: z.string(),
  endDate: z.string(),
})

export const RenewSubscriptionResponseSchema = z.object({
  message: z.string(),
  newEndDate: z.string(),
})

export const SubscriptionStatusResponseSchema = z.object({
  hasActiveSubscription: z.boolean(),
  currentPlan: z
    .object({
      id: z.number(),
      planName: z.string(),
      endDate: z.string(),
      autoRenew: z.boolean(),
    })
    .nullable(),
})

export type UserSubscriptionType = z.infer<typeof UserSubscriptionSchema>
export type CreateUserSubscriptionType = z.infer<typeof CreateUserSubscriptionSchema>
export type UpdateUserSubscriptionType = z.infer<typeof UpdateUserSubscriptionSchema>
export type GetUserSubscriptionsQueryType = z.infer<typeof GetUserSubscriptionsQuerySchema>
export type UserSubscriptionResponseType = z.infer<typeof UserSubscriptionResponseSchema>
export type PaginatedUserSubscriptionsResponseType = z.infer<typeof PaginatedUserSubscriptionsResponseSchema>
export type CancelSubscriptionResponseType = z.infer<typeof CancelSubscriptionResponseSchema>
export type RenewSubscriptionResponseType = z.infer<typeof RenewSubscriptionResponseSchema>
export type SubscriptionStatusResponseType = z.infer<typeof SubscriptionStatusResponseSchema>
