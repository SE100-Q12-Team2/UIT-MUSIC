import { Injectable } from '@nestjs/common'
import { UserSubscriptionRepository } from './user-subscription.repo'
import {
  CreateUserSubscriptionType,
  UpdateUserSubscriptionType,
  GetUserSubscriptionsQueryType,
  UserSubscriptionResponseType,
  PaginatedUserSubscriptionsResponseType,
  CancelSubscriptionResponseType,
  RenewSubscriptionResponseType,
  SubscriptionStatusResponseType,
} from './user-subscription.model'
import {
  UserSubscriptionNotFoundError,
  SubscriptionPlanNotFoundError,
  AlreadyHasActiveSubscriptionError,
  SubscriptionAlreadyCancelledError,
  SubscriptionExpiredError,
  CannotRenewInactiveSubscriptionError,
} from './user-subscription.error'
import { isNotFoundPrismaError } from 'src/shared/lib'

@Injectable()
export class UserSubscriptionService {
  constructor(private readonly userSubscriptionRepo: UserSubscriptionRepository) {}

  async subscribe(userId: number, data: CreateUserSubscriptionType): Promise<UserSubscriptionResponseType> {
    const planExists = await this.userSubscriptionRepo.checkPlanExists(data.planId)
    if (!planExists) {
      throw SubscriptionPlanNotFoundError
    }

    const activeSubscription = await this.userSubscriptionRepo.getActiveSubscription(userId)
    if (activeSubscription) {
      throw AlreadyHasActiveSubscriptionError
    }

    const startDate = new Date()
    const durationMonths = await this.userSubscriptionRepo.getPlanDuration(data.planId)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + durationMonths)

    return await this.userSubscriptionRepo.createSubscription(userId, data, startDate, endDate)
  }

  async getUserSubscriptions(
    userId: number,
    query: GetUserSubscriptionsQueryType,
  ): Promise<PaginatedUserSubscriptionsResponseType> {
    return await this.userSubscriptionRepo.getUserSubscriptions(userId, query)
  }

  async getSubscriptionById(userId: number, id: number): Promise<UserSubscriptionResponseType> {
    const subscription = await this.userSubscriptionRepo.getSubscriptionById(id, userId)

    if (!subscription) {
      throw UserSubscriptionNotFoundError
    }

    return subscription
  }

  async getActiveSubscription(userId: number): Promise<UserSubscriptionResponseType | null> {
    return await this.userSubscriptionRepo.getActiveSubscription(userId)
  }

  async updateSubscription(
    userId: number,
    id: number,
    data: UpdateUserSubscriptionType,
  ): Promise<UserSubscriptionResponseType> {
    try {
      return await this.userSubscriptionRepo.updateSubscription(id, userId, data)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw UserSubscriptionNotFoundError
      }
      throw error
    }
  }

  async cancelSubscription(userId: number, id: number): Promise<CancelSubscriptionResponseType> {
    const subscription = await this.userSubscriptionRepo.getSubscriptionById(id, userId)
    if (!subscription) {
      throw UserSubscriptionNotFoundError
    }

    if (!subscription.isActive) {
      throw SubscriptionAlreadyCancelledError
    }

    try {
      const result = await this.userSubscriptionRepo.cancelSubscription(id, userId)
      return {
        message: 'Subscription cancelled successfully. Access will remain until the end date.',
        endDate: result.endDate.toISOString(),
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw UserSubscriptionNotFoundError
      }
      throw error
    }
  }

  async renewSubscription(userId: number, id: number): Promise<RenewSubscriptionResponseType> {
    const subscription = await this.userSubscriptionRepo.getSubscriptionById(id, userId)
    if (!subscription) {
      throw UserSubscriptionNotFoundError
    }

    if (!subscription.isActive) {
      throw CannotRenewInactiveSubscriptionError
    }

    const now = new Date()
    if (new Date(subscription.endDate) < now) {
      throw SubscriptionExpiredError
    }

    const newEndDate = new Date(subscription.endDate)
    newEndDate.setMonth(newEndDate.getMonth() + subscription.plan.durationMonths)

    try {
      const result = await this.userSubscriptionRepo.renewSubscription(id, userId, newEndDate)
      return {
        message: 'Subscription renewed successfully',
        newEndDate: result.newEndDate.toISOString(),
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw UserSubscriptionNotFoundError
      }
      throw error
    }
  }

  async checkSubscriptionStatus(userId: number): Promise<SubscriptionStatusResponseType> {
    const activeSubscription = await this.userSubscriptionRepo.getActiveSubscription(userId)

    if (!activeSubscription) {
      return {
        hasActiveSubscription: false,
        currentPlan: null,
      }
    }

    return {
      hasActiveSubscription: true,
      currentPlan: {
        id: activeSubscription.planId,
        planName: activeSubscription.plan.planName,
        endDate: activeSubscription.endDate,
        autoRenew: activeSubscription.autoRenew,
      },
    }
  }
}
