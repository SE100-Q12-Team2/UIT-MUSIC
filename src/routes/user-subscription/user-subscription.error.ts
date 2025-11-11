import { NotFoundException, BadRequestException } from '@nestjs/common'

export const UserSubscriptionNotFoundError = new NotFoundException([
  {
    path: 'subscriptionId',
    message: 'Error.UserSubscriptionNotFound',
  },
])

export const SubscriptionPlanNotFoundError = new NotFoundException([
  {
    path: 'planId',
    message: 'Error.SubscriptionPlanNotFound',
  },
])

export const AlreadyHasActiveSubscriptionError = new BadRequestException([
  {
    path: 'subscription',
    message: 'Error.AlreadyHasActiveSubscription',
  },
])

export const SubscriptionAlreadyCancelledError = new BadRequestException([
  {
    path: 'subscriptionId',
    message: 'Error.SubscriptionAlreadyCancelled',
  },
])

export const SubscriptionExpiredError = new BadRequestException([
  {
    path: 'subscriptionId',
    message: 'Error.SubscriptionExpired',
  },
])

export const CannotRenewInactiveSubscriptionError = new BadRequestException([
  {
    path: 'subscriptionId',
    message: 'Error.CannotRenewInactiveSubscription',
  },
])
