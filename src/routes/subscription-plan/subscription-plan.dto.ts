import { createZodDto } from 'nestjs-zod'
import {
  CreateSubscriptionPlanSchema,
  UpdateSubscriptionPlanSchema,
  GetSubscriptionPlansQuerySchema,
  SubscriptionPlanResponseSchema,
  PaginatedSubscriptionPlansResponseSchema,
  SubscriptionPlanStatsSchema,
} from './subscription-plan.model'

export class CreateSubscriptionPlanDto extends createZodDto(CreateSubscriptionPlanSchema) {}

export class UpdateSubscriptionPlanDto extends createZodDto(UpdateSubscriptionPlanSchema) {}

export class GetSubscriptionPlansQueryDto extends createZodDto(GetSubscriptionPlansQuerySchema) {}

export class SubscriptionPlanResponseDto extends createZodDto(SubscriptionPlanResponseSchema) {}

export class PaginatedSubscriptionPlansResponseDto extends createZodDto(PaginatedSubscriptionPlansResponseSchema) {}

export class SubscriptionPlanStatsDto extends createZodDto(SubscriptionPlanStatsSchema) {}
