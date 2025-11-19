import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  CreateUserSubscriptionType,
  UpdateUserSubscriptionType,
  GetUserSubscriptionsQueryType,
  UserSubscriptionResponseType,
  PaginatedUserSubscriptionsResponseType,
} from './user-subscription.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class UserSubscriptionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createSubscription(
    userId: number,
    data: CreateUserSubscriptionType,
    startDate: Date,
    endDate: Date,
  ): Promise<UserSubscriptionResponseType> {
    const subscription = await this.prismaService.userSubscription.create({
      data: {
        userId,
        planId: data.planId,
        startDate,
        endDate,
        isActive: true,
        autoRenew: data.autoRenew ?? false,
      },
      include: {
        plan: {
          select: {
            id: true,
            planName: true,
            durationMonths: true,
            price: true,
            features: true,
          },
        },
      },
    })

    return {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.planId,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      isActive: subscription.isActive,
      autoRenew: subscription.autoRenew,
      createdAt: subscription.createdAt.toISOString(),
      plan: {
        id: subscription.plan.id,
        planName: subscription.plan.planName,
        durationMonths: subscription.plan.durationMonths,
        price: Number(subscription.plan.price),
        features: subscription.plan.features as any,
      },
    }
  }

  async getUserSubscriptions(
    userId: number,
    query: GetUserSubscriptionsQueryType,
  ): Promise<PaginatedUserSubscriptionsResponseType> {
    const skip = (query.page - 1) * query.limit

    const where: Prisma.UserSubscriptionWhereInput = {
      userId,
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }

    if (query.planId) {
      where.planId = query.planId
    }

    const [totalItems, subscriptions] = await Promise.all([
      this.prismaService.userSubscription.count({ where }),
      this.prismaService.userSubscription.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          plan: {
            select: {
              id: true,
              planName: true,
              durationMonths: true,
              price: true,
              features: true,
            },
          },
        },
      }),
    ])

    const data = subscriptions.map((sub) => ({
      ...sub,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
      createdAt: sub.createdAt.toISOString(),
      plan: {
        ...sub.plan,
        price: Number(sub.plan.price),
        features: sub.plan.features as any,
      },
    }))

    return {
      data,
      totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(totalItems / query.limit),
    }
  }

  async getSubscriptionById(id: number, userId: number): Promise<UserSubscriptionResponseType | null> {
    const subscription = await this.prismaService.userSubscription.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        plan: {
          select: {
            id: true,
            planName: true,
            durationMonths: true,
            price: true,
            features: true,
          },
        },
      },
    })

    if (!subscription) return null

    return {
      ...subscription,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      plan: {
        ...subscription.plan,
        price: Number(subscription.plan.price),
        features: subscription.plan.features as any,
      },
    }
  }

  async getActiveSubscription(userId: number): Promise<UserSubscriptionResponseType | null> {
    const subscription = await this.prismaService.userSubscription.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        plan: {
          select: {
            id: true,
            planName: true,
            durationMonths: true,
            price: true,
            features: true,
          },
        },
      },
      orderBy: {
        endDate: 'desc',
      },
    })

    if (!subscription) return null

    return {
      ...subscription,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      plan: {
        ...subscription.plan,
        price: Number(subscription.plan.price),
        features: subscription.plan.features as any,
      },
    }
  }

  async updateSubscription(
    id: number,
    userId: number,
    data: UpdateUserSubscriptionType,
  ): Promise<UserSubscriptionResponseType> {
    const updateData: Prisma.UserSubscriptionUpdateInput = {}

    if (data.autoRenew !== undefined) {
      updateData.autoRenew = data.autoRenew
    }

    const subscription = await this.prismaService.userSubscription.update({
      where: {
        id,
        userId,
      },
      data: updateData,
      include: {
        plan: {
          select: {
            id: true,
            planName: true,
            durationMonths: true,
            price: true,
            features: true,
          },
        },
      },
    })

    return {
      ...subscription,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      plan: {
        ...subscription.plan,
        price: Number(subscription.plan.price),
        features: subscription.plan.features as any,
      },
    }
  }

  async cancelSubscription(id: number, userId: number): Promise<{ endDate: Date }> {
    const subscription = await this.prismaService.userSubscription.update({
      where: {
        id,
        userId,
      },
      data: {
        isActive: false,
        autoRenew: false,
      },
    })

    return { endDate: subscription.endDate }
  }

  async renewSubscription(id: number, userId: number, newEndDate: Date): Promise<{ newEndDate: Date }> {
    await this.prismaService.userSubscription.update({
      where: {
        id,
        userId,
      },
      data: {
        endDate: newEndDate,
        isActive: true,
      },
    })

    return { newEndDate }
  }

  async checkPlanExists(planId: number): Promise<boolean> {
    const plan = await this.prismaService.subscriptionPlan.findUnique({
      where: { id: planId },
    })
    return !!plan
  }

  async getPlanDuration(planId: number): Promise<number> {
    const plan = await this.prismaService.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { durationMonths: true },
    })
    return plan?.durationMonths ?? 1
  }
}
