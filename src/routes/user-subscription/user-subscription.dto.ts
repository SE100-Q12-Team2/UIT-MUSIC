import { createZodDto } from 'nestjs-zod'
import {
  CreateUserSubscriptionSchema,
  UpdateUserSubscriptionSchema,
  GetUserSubscriptionsQuerySchema,
  UserSubscriptionResponseSchema,
  PaginatedUserSubscriptionsResponseSchema,
  CancelSubscriptionResponseSchema,
  RenewSubscriptionResponseSchema,
  SubscriptionStatusResponseSchema,
} from './user-subscription.model'

export class CreateUserSubscriptionDto extends createZodDto(CreateUserSubscriptionSchema) {}

export class UpdateUserSubscriptionDto extends createZodDto(UpdateUserSubscriptionSchema) {}

export class GetUserSubscriptionsQueryDto extends createZodDto(GetUserSubscriptionsQuerySchema) {}

export class UserSubscriptionResponseDto extends createZodDto(UserSubscriptionResponseSchema) {}
export class PaginatedUserSubscriptionsResponseDto extends createZodDto(PaginatedUserSubscriptionsResponseSchema) {}
export class CancelSubscriptionResponseDto extends createZodDto(CancelSubscriptionResponseSchema) {}
export class RenewSubscriptionResponseDto extends createZodDto(RenewSubscriptionResponseSchema) {}
export class SubscriptionStatusResponseDto extends createZodDto(SubscriptionStatusResponseSchema) {}
