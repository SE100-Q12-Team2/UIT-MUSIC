import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { AdType, Prisma } from '@prisma/client'
import { QueryAdvertisementsDto, CreateAdImpressionDto, TargetAudience } from './advertisement.model'
import { AdvertisementNotFoundException, AdImpressionNotFoundException } from './advertisement.error'

@Injectable()
export class AdvertisementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    adName: string
    adType: AdType
    filePath?: string
    duration?: number
    targetAudience?: TargetAudience
    startDate: Date
    endDate: Date
    isActive?: boolean
  }) {
    return this.prisma.advertisement.create({
      data: {
        adName: data.adName,
        adType: data.adType,
        filePath: data.filePath,
        duration: data.duration,
        targetAudience: data.targetAudience as any,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true,
      },
      include: {
        _count: {
          select: {
            impressions: true,
          },
        },
      },
    })
  }

  async findAll(query: QueryAdvertisementsDto) {
    const { page, limit, adType, isActive, search } = query
    const skip = (page - 1) * limit

    const where: Prisma.AdvertisementWhereInput = {
      ...(adType && { adType }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        adName: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.advertisement.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              impressions: true,
            },
          },
        },
      }),
      this.prisma.advertisement.count({ where }),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: number) {
    return this.prisma.advertisement.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            impressions: true,
          },
        },
      },
    })
  }

  async update(
    id: number,
    data: {
      adName?: string
      adType?: AdType
      filePath?: string
      duration?: number
      targetAudience?: TargetAudience
      startDate?: Date
      endDate?: Date
      isActive?: boolean
    },
  ) {
    try {
      return await this.prisma.advertisement.update({
        where: { id },
        data: {
          ...(data.adName && { adName: data.adName }),
          ...(data.adType && { adType: data.adType }),
          ...(data.filePath !== undefined && { filePath: data.filePath }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.targetAudience !== undefined && { targetAudience: data.targetAudience as any }),
          ...(data.startDate && { startDate: data.startDate }),
          ...(data.endDate && { endDate: data.endDate }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          _count: {
            select: {
              impressions: true,
            },
          },
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw AdvertisementNotFoundException
        }
      }
      throw error
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.advertisement.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw AdvertisementNotFoundException
        }
      }
      throw error
    }
  }

  async getActiveAds(adType?: AdType, limit: number = 5, userId?: number) {
    const now = new Date()

    let userInfo: any = null
    if (userId) {
      userInfo = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          gender: true,
          dateOfBirth: true,
          subscriptions: {
            where: {
              isActive: true,
              endDate: {
                gte: now,
              },
            },
            select: {
              id: true,
            },
          },
        },
      })
    }

    const hasPremium = userInfo?.subscriptions && userInfo.subscriptions.length > 0

    const ads = await this.prisma.advertisement.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
        ...(adType && { adType }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            impressions: true,
          },
        },
      },
    })

    const filteredAds = ads.filter((ad) => {
      if (!ad.targetAudience) return true

      const target = ad.targetAudience as any

      if (target.subscriptionType) {
        if (target.subscriptionType === 'Premium' && !hasPremium) return false
        if (target.subscriptionType === 'Free' && hasPremium) return false
      }

      if (target.gender && target.gender !== 'All' && userInfo) {
        if (userInfo.gender !== target.gender) return false
      }

      if (target.ageRange && userInfo?.dateOfBirth) {
        const age = this.calculateAge(userInfo.dateOfBirth)
        if (target.ageRange.min && age < target.ageRange.min) return false
        if (target.ageRange.max && age > target.ageRange.max) return false
      }

      return true
    })

    return filteredAds.slice(0, limit)
  }

  async createImpression(data: CreateAdImpressionDto) {
    return this.prisma.adImpression.create({
      data: {
        adId: data.adId,
        userId: data.userId,
        clicked: data.clicked ?? false,
      },
    })
  }

  async trackClick(impressionId: number) {
    try {
      return await this.prisma.adImpression.update({
        where: { id: impressionId },
        data: {
          clicked: true,
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw AdImpressionNotFoundException
        }
      }
      throw error
    }
  }

  async getAdStats(adId: number, startDate?: Date, endDate?: Date) {
    const where: Prisma.AdImpressionWhereInput = {
      adId,
      ...(startDate && { displayedAt: { gte: startDate } }),
      ...(endDate && { displayedAt: { lte: endDate } }),
    }

    const [totalImpressions, totalClicks, uniqueViewers] = await Promise.all([
      this.prisma.adImpression.count({ where }),
      this.prisma.adImpression.count({
        where: {
          ...where,
          clicked: true,
        },
      }),
      this.prisma.adImpression
        .findMany({
          where,
          select: {
            userId: true,
          },
          distinct: ['userId'],
        })
        .then((results) => results.filter((r) => r.userId !== null).length),
    ])

    const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    return {
      totalImpressions,
      totalClicks,
      clickThroughRate: parseFloat(clickThroughRate.toFixed(2)),
      uniqueViewers,
    }
  }

  async getOverallStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.AdImpressionWhereInput = {
      ...(startDate && { displayedAt: { gte: startDate } }),
      ...(endDate && { displayedAt: { lte: endDate } }),
    }

    const [totalImpressions, totalClicks, uniqueViewers, impressionsByType, topAds] = await Promise.all([
      this.prisma.adImpression.count({ where }),
      this.prisma.adImpression.count({
        where: {
          ...where,
          clicked: true,
        },
      }),
      this.prisma.adImpression
        .findMany({
          where,
          select: {
            userId: true,
          },
          distinct: ['userId'],
        })
        .then((results) => results.filter((r) => r.userId !== null).length),
      this.prisma.adImpression.groupBy({
        by: ['adId'],
        where,
        _count: {
          id: true,
        },
      }),
      this.prisma.adImpression.groupBy({
        by: ['adId'],
        where,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
    ])

    const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    const topAdIds = topAds.map((ad) => ad.adId)
    const adDetails = await this.prisma.advertisement.findMany({
      where: {
        id: {
          in: topAdIds,
        },
      },
      select: {
        id: true,
        adName: true,
        adType: true,
      },
    })

    const topPerformingAds = await Promise.all(
      topAds.map(async (ad) => {
        const details = adDetails.find((d) => d.id === ad.adId)
        const impressions = ad._count?.id || 0

        const clicks = await this.prisma.adImpression.count({
          where: {
            ...where,
            adId: ad.adId,
            clicked: true,
          },
        })

        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

        return {
          id: ad.adId,
          adName: details?.adName || 'Unknown',
          adType: details?.adType || ('Audio' as AdType),
          impressions,
          clicks,
          ctr: parseFloat(ctr.toFixed(2)),
        }
      }),
    )

    const impressionsByTypeMap: Record<string, number> = {}
    for (const imp of impressionsByType) {
      const ad = await this.prisma.advertisement.findUnique({
        where: { id: imp.adId },
        select: { adType: true },
      })
      if (ad) {
        impressionsByTypeMap[ad.adType] = (impressionsByTypeMap[ad.adType] || 0) + imp._count.id
      }
    }

    return {
      totalImpressions,
      totalClicks,
      clickThroughRate: parseFloat(clickThroughRate.toFixed(2)),
      uniqueViewers,
      impressionsByType: impressionsByTypeMap,
      topPerformingAds,
    }
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }
}
