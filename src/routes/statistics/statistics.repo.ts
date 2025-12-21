import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PeriodType, Prisma } from '@prisma/client'

@Injectable()
export class StatisticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyStats(startDate: Date, endDate: Date) {
    const stats = await this.prisma.dailyStatistic.findMany({
      where: {
        statDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        statDate: 'asc',
      },
    })

    return stats.map((stat) => ({
      ...stat,
      totalPlays: Number(stat.totalPlays),
      adImpressions: Number(stat.adImpressions),
      revenueSubscription: Number(stat.revenueSubscription),
      revenueAds: Number(stat.revenueAds),
    }))
  }

  async getTrendingSongs(periodType: PeriodType, limit: number = 10) {
    const latestPeriod = await this.prisma.trendingSong.findFirst({
      where: { periodType },
      orderBy: { periodStart: 'desc' },
      select: {
        periodStart: true,
        periodEnd: true,
      },
    })

    if (!latestPeriod) {
      return []
    }

    const trendingSongs = await this.prisma.trendingSong.findMany({
      where: {
        periodType,
        periodStart: latestPeriod.periodStart,
        periodEnd: latestPeriod.periodEnd,
      },
      orderBy: {
        rankPosition: 'asc',
      },
      take: limit,
      include: {
        song: {
          include: {
            album: {
              select: {
                coverImage: true,
              },
            },
            contributors: {
              include: {
                label: {
                  select: {
                    id: true,
                    labelName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return trendingSongs.map((ts) => ({
      ...ts,
      playCount: Number(ts.playCount),
      song: {
        id: ts.song.id,
        title: ts.song.title,
        duration: ts.song.duration,
        coverImage: ts.song.album?.coverImage || null,
        contributors: ts.song.contributors.map((c) => ({
          labelId: c.label.id,
          labelName: c.label.labelName,
          role: c.role,
        })),
      },
    }))
  }

  async getRevenueStats(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month') {
    const stats = await this.getDailyStats(startDate, endDate)

    if (groupBy === 'day') {
      return stats.map((stat) => ({
        period: stat.statDate.toISOString().split('T')[0],
        revenueSubscription: stat.revenueSubscription,
        revenueAds: stat.revenueAds,
        totalRevenue: stat.revenueSubscription + stat.revenueAds,
        newSubscriptions: stat.premiumUsersCount,
      }))
    }

    const grouped = new Map<string, any>()

    stats.forEach((stat) => {
      let key: string
      const date = new Date(stat.statDate)

      if (groupBy === 'week') {
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -6 : 1)
        const weekStart = new Date(date.setDate(diff))
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          period: key,
          revenueSubscription: 0,
          revenueAds: 0,
          totalRevenue: 0,
          newSubscriptions: 0,
        })
      }

      const current = grouped.get(key)
      current.revenueSubscription += stat.revenueSubscription
      current.revenueAds += stat.revenueAds
      current.totalRevenue += stat.revenueSubscription + stat.revenueAds
      current.newSubscriptions += stat.premiumUsersCount
    })

    return Array.from(grouped.values())
  }

  async getUserEngagementStats(startDate: Date, endDate: Date) {
    const [totalUsers, activeUsersResult, premiumUsersResult, listeningStats, topGenresResult] = await Promise.all([
      this.prisma.user.count({
        where: { isDeleted: false },
      }),

      this.prisma.listeningHistory.findMany({
        where: {
          playedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      }),

      this.prisma.userSubscription.count({
        where: {
          isActive: true,
          endDate: {
            gte: new Date(),
          },
        },
      }),

      this.prisma.listeningHistory.aggregate({
        where: {
          playedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          durationListened: true,
        },
        _count: {
          id: true,
        },
      }),

      this.prisma.listeningHistory.groupBy({
        by: ['songId'],
        where: {
          playedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          songId: true,
        },
      }),
    ])

    const songIds = topGenresResult.map((r) => r.songId)
    const songs = await this.prisma.song.findMany({
      where: {
        id: { in: songIds },
      },
      select: {
        id: true,
        genreId: true,
      },
    })

    const genrePlayCounts = new Map<number, number>()
    topGenresResult.forEach((result) => {
      const song = songs.find((s) => s.id === result.songId)
      if (song?.genreId) {
        const current = genrePlayCounts.get(song.genreId) || 0
        genrePlayCounts.set(song.genreId, current + result._count.songId)
      }
    })

    const genreIds = Array.from(genrePlayCounts.keys())
    const genres = await this.prisma.genre.findMany({
      where: { id: { in: genreIds } },
      select: { id: true, genreName: true },
    })

    const topGenres = genres
      .map((genre) => ({
        genreId: genre.id,
        genreName: genre.genreName,
        playCount: genrePlayCounts.get(genre.id) || 0,
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10)

    const activeUsers = activeUsersResult.length
    const totalPlays = listeningStats._count.id
    const totalPlayTime = Number(listeningStats._sum.durationListened || 0)

    return {
      totalUsers,
      activeUsers,
      premiumUsers: premiumUsersResult,
      freeUsers: totalUsers - premiumUsersResult,
      avgSessionsPerUser: activeUsers > 0 ? totalPlays / activeUsers : 0,
      avgPlayTimePerUser: activeUsers > 0 ? totalPlayTime / activeUsers : 0,
      topGenres,
    }
  }

  async getDashboardOverview() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)

    const [
      totalUsers,
      activeUsersToday,
      premiumUsers,
      newUsersToday,
      totalSongs,
      totalAlbums,
      totalLabels,
      totalPlaylists,
      playsToday,
      playTimeToday,
      todayStats,
      monthStats,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isDeleted: false } }),

      this.prisma.listeningHistory.findMany({
        where: { playedAt: { gte: today, lt: tomorrow } },
        select: { userId: true },
        distinct: ['userId'],
      }),

      this.prisma.userSubscription.count({
        where: { isActive: true, endDate: { gte: new Date() } },
      }),

      this.prisma.user.count({
        where: { createdAt: { gte: today, lt: tomorrow }, isDeleted: false },
      }),

      this.prisma.song.count({ where: { isActive: true } }),

      this.prisma.album.count(),

      this.prisma.recordLabel.count(),

      this.prisma.playlist.count(),

      this.prisma.listeningHistory.count({
        where: { playedAt: { gte: today, lt: tomorrow } },
      }),

      this.prisma.listeningHistory.aggregate({
        where: { playedAt: { gte: today, lt: tomorrow } },
        _sum: { durationListened: true },
      }),

      this.prisma.dailyStatistic.findUnique({
        where: { statDate: today },
      }),

      this.prisma.dailyStatistic.aggregate({
        where: { statDate: { gte: monthStart, lte: monthEnd } },
        _sum: {
          revenueSubscription: true,
          revenueAds: true,
        },
      }),
    ])

    const avgPlaysPerUser = activeUsersToday.length > 0 ? playsToday / activeUsersToday.length : 0

    return {
      users: {
        total: totalUsers,
        active: activeUsersToday.length,
        premium: premiumUsers,
        newToday: newUsersToday,
      },
      content: {
        totalSongs,
        totalAlbums,
        totalLabels,
        totalPlaylists,
      },
      engagement: {
        totalPlays: playsToday,
        totalPlayTime: Number(playTimeToday._sum.durationListened || 0),
        avgPlaysPerUser,
      },
      revenue: {
        todaySubscription: Number(todayStats?.revenueSubscription || 0),
        todayAds: Number(todayStats?.revenueAds || 0),
        monthSubscription: Number(monthStats._sum.revenueSubscription || 0),
        monthAds: Number(monthStats._sum.revenueAds || 0),
        totalMonth: Number(monthStats._sum.revenueSubscription || 0) + Number(monthStats._sum.revenueAds || 0),
      },
    }
  }

  async updateDailyStatistics(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const [totalPlays, uniqueListeners, premiumUsers, newRegistrations, adImpressions] = await Promise.all([
      this.prisma.listeningHistory.count({
        where: { playedAt: { gte: startOfDay, lte: endOfDay } },
      }),

      this.prisma.listeningHistory.findMany({
        where: { playedAt: { gte: startOfDay, lte: endOfDay } },
        select: { userId: true },
        distinct: ['userId'],
      }),

      this.prisma.userSubscription.count({
        where: {
          isActive: true,
          startDate: { lte: endOfDay },
          endDate: { gte: startOfDay },
        },
      }),

      this.prisma.user.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),

      this.prisma.adImpression.count({
        where: { displayedAt: { gte: startOfDay, lte: endOfDay } },
      }),
    ])

    const transactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        transactionStatus: 'Completed',
      },
      select: {
        amount: true,
        subscription: {
          select: {
            id: true,
          },
        },
      },
    })

    const revenueSubscription = transactions.filter((t) => t.subscription).reduce((sum, t) => sum + Number(t.amount), 0)

    const revenueAds = 0

    return this.prisma.dailyStatistic.upsert({
      where: { statDate: startOfDay },
      update: {
        totalPlays: BigInt(totalPlays),
        uniqueListeners: uniqueListeners.length,
        premiumUsersCount: premiumUsers,
        newRegistrations,
        adImpressions: BigInt(adImpressions),
        revenueSubscription: new Prisma.Decimal(revenueSubscription),
        revenueAds: new Prisma.Decimal(revenueAds),
      },
      create: {
        statDate: startOfDay,
        totalPlays: BigInt(totalPlays),
        uniqueListeners: uniqueListeners.length,
        premiumUsersCount: premiumUsers,
        newRegistrations,
        adImpressions: BigInt(adImpressions),
        revenueSubscription: new Prisma.Decimal(revenueSubscription),
        revenueAds: new Prisma.Decimal(revenueAds),
      },
    })
  }
}
