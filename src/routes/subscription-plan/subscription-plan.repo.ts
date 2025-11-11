import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  CreateSubscriptionPlanType,
  UpdateSubscriptionPlanType,
  GetSubscriptionPlansQueryType,
  SubscriptionPlanResponseType,
  PaginatedSubscriptionPlansResponseType,
  SubscriptionPlanStatsType,
} from './subscription-plan.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class SubscriptionPlanRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createPlan(data: CreateSubscriptionPlanType): Promise<SubscriptionPlanResponseType> {
    const plan = await this.prismaService.subscriptionPlan.create({
      data: {
        planName: data.planName,
        durationMonths: data.durationMonths,
        price: data.price,
        features: data.features ? (data.features as Prisma.InputJsonValue) : Prisma.JsonNull,
        isActive: data.isActive ?? true,
      },
    })

    return {
      ...plan,
      price: Number(plan.price),
      features: plan.features as any,
    }
  }

  async getPlans(query: GetSubscriptionPlansQueryType): Promise<PaginatedSubscriptionPlansResponseType> {
    const skip = (query.page - 1) * query.limit

    const where: Prisma.SubscriptionPlanWhereInput = {}

    console.log('query', query)

    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }

    if (query.search) {
      where.planName = {
        contains: query.search,
        mode: 'insensitive',
      }
    }

    const [totalItems, plans] = await Promise.all([
      this.prismaService.subscriptionPlan.count({ where }),
      this.prismaService.subscriptionPlan.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    const data = plans.map((plan) => ({
      ...plan,
      price: Number(plan.price),
      features: plan.features as any,
    }))

    return {
      data,
      totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(totalItems / query.limit),
    }
  }

  async getPlanById(id: number): Promise<SubscriptionPlanResponseType | null> {
    const plan = await this.prismaService.subscriptionPlan.findUnique({
      where: { id },
    })

    if (!plan) return null

    return {
      ...plan,
      price: Number(plan.price),
      features: plan.features as any,
    }
  }

  async updatePlan(id: number, data: UpdateSubscriptionPlanType): Promise<SubscriptionPlanResponseType> {
    const updateData: Prisma.SubscriptionPlanUpdateInput = {}

    if (data.planName !== undefined) updateData.planName = data.planName
    if (data.durationMonths !== undefined) updateData.durationMonths = data.durationMonths
    if (data.price !== undefined) updateData.price = data.price
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.features !== undefined) {
      updateData.features = data.features as Prisma.InputJsonValue
    }

    const plan = await this.prismaService.subscriptionPlan.update({
      where: { id },
      data: updateData,
    })

    return {
      ...plan,
      price: Number(plan.price),
      features: plan.features as any,
    }
  }

  async deletePlan(id: number): Promise<{ message: string }> {
    await this.prismaService.subscriptionPlan.delete({
      where: { id },
    })

    return {
      message: 'Subscription plan deleted successfully',
    }
  }

  async checkPlanHasActiveSubscriptions(planId: number): Promise<boolean> {
    const count = await this.prismaService.userSubscription.count({
      where: {
        planId,
        isActive: true,
      },
    })

    return count > 0
  }

  async getStats(): Promise<SubscriptionPlanStatsType> {
    const [totalPlans, activePlans, subscriptionData] = await Promise.all([
      this.prismaService.subscriptionPlan.count(),
      this.prismaService.subscriptionPlan.count({ where: { isActive: true } }),
      this.prismaService.subscriptionPlan.findMany({
        include: {
          _count: {
            select: {
              userSubscriptions: {
                where: {
                  isActive: true,
                },
              },
            },
          },
        },
      }),
    ])

    const inactivePlans = totalPlans - activePlans

    // Calculate total subscribers
    const totalSubscribers = subscriptionData.reduce((sum, plan) => sum + plan._count.userSubscriptions, 0)

    // Calculate average price
    const averagePrice =
      totalPlans > 0 ? subscriptionData.reduce((sum, plan) => sum + Number(plan.price), 0) / totalPlans : 0

    // Plan distribution
    const planDistribution = subscriptionData.map((plan) => ({
      planId: plan.id,
      planName: plan.planName,
      subscriberCount: plan._count.userSubscriptions,
      percentage: totalSubscribers > 0 ? (plan._count.userSubscriptions / totalSubscribers) * 100 : 0,
    }))

    return {
      totalPlans,
      activePlans,
      inactivePlans,
      totalSubscribers,
      averagePrice: Math.round(averagePrice * 100) / 100,
      planDistribution,
    }
  }
}
