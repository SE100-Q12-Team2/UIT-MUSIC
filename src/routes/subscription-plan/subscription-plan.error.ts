import { NotFoundException, BadRequestException } from '@nestjs/common'

export const SubscriptionPlanNotFoundError = new NotFoundException([
  {
    path: 'planId',
    message: 'Error.SubscriptionPlanNotFound',
  },
])

export const SubscriptionPlanAlreadyExistsError = new BadRequestException([
  {
    path: 'planName',
    message: 'Error.SubscriptionPlanAlreadyExists',
  },
])

export const CannotDeleteActivePlanError = new BadRequestException([
  {
    path: 'planId',
    message: 'Error.CannotDeleteActivePlan',
  },
])

export const PlanHasActiveSubscriptionsError = new BadRequestException([
  {
    path: 'planId',
    message: 'Error.PlanHasActiveSubscriptions',
  },
])
