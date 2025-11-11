import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { SubscriptionPlanRepository } from './subscription-plan.repo'
import {
  CreateSubscriptionPlanType,
  UpdateSubscriptionPlanType,
  GetSubscriptionPlansQueryType,
  SubscriptionPlanResponseType,
  PaginatedSubscriptionPlansResponseType,
  SubscriptionPlanStatsType,
} from './subscription-plan.model'
import {
  SubscriptionPlanNotFoundError,
  SubscriptionPlanAlreadyExistsError,
  CannotDeleteActivePlanError,
  PlanHasActiveSubscriptionsError,
} from './subscription-plan.error'
import { isNotFoundPrismaError } from 'src/shared/lib'

@Injectable()
export class SubscriptionPlanService {
  constructor(private readonly subscriptionPlanRepo: SubscriptionPlanRepository) {}

  async createPlan(data: CreateSubscriptionPlanType): Promise<SubscriptionPlanResponseType> {
    try {
      return await this.subscriptionPlanRepo.createPlan(data)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw SubscriptionPlanAlreadyExistsError
      }
      throw error
    }
  }

  async getPlans(query: GetSubscriptionPlansQueryType): Promise<PaginatedSubscriptionPlansResponseType> {
    return await this.subscriptionPlanRepo.getPlans(query)
  }

  async getPlanById(id: number): Promise<SubscriptionPlanResponseType> {
    const plan = await this.subscriptionPlanRepo.getPlanById(id)

    if (!plan) {
      throw SubscriptionPlanNotFoundError
    }

    return plan
  }

  async updatePlan(id: number, data: UpdateSubscriptionPlanType): Promise<SubscriptionPlanResponseType> {
    try {
      return await this.subscriptionPlanRepo.updatePlan(id, data)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw SubscriptionPlanNotFoundError
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw SubscriptionPlanAlreadyExistsError
      }
      throw error
    }
  }

  async deletePlan(id: number): Promise<{ message: string }> {
    try {
      const plan = await this.subscriptionPlanRepo.getPlanById(id)
      if (!plan) {
        throw SubscriptionPlanNotFoundError
      }

      if (plan.isActive) {
        throw CannotDeleteActivePlanError
      }

      const hasActiveSubscriptions = await this.subscriptionPlanRepo.checkPlanHasActiveSubscriptions(id)
      if (hasActiveSubscriptions) {
        throw PlanHasActiveSubscriptionsError
      }

      return await this.subscriptionPlanRepo.deletePlan(id)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw SubscriptionPlanNotFoundError
      }
      throw error
    }
  }

  async getStats(): Promise<SubscriptionPlanStatsType> {
    return await this.subscriptionPlanRepo.getStats()
  }
}
