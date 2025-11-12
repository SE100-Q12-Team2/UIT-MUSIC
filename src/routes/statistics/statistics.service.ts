import { Injectable, Logger } from '@nestjs/common'
import { StatisticsRepository } from './statistics.repo'
import {
  GetDailyStatsQuery,
  GetTrendingSongsQuery,
  GetRevenueStatsQuery,
  GetUserEngagementQuery,
} from './statistics.model'
import { PeriodType } from '@prisma/client'

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name)

  constructor(private readonly repository: StatisticsRepository) {}

  async getDailyStats(query: GetDailyStatsQuery) {
    const startDate = new Date(query.startDate)
    const endDate = new Date(query.endDate)

    if (startDate > endDate) {
      throw new Error('Start date must be before end date')
    }

    const data = await this.repository.getDailyStats(startDate, endDate)

    const summary = {
      totalPlays: data.reduce((sum, stat) => sum + stat.totalPlays, 0),
      totalUniqueListeners: data.reduce((sum, stat) => sum + stat.uniqueListeners, 0),
      totalRevenue: data.reduce((sum, stat) => sum + stat.revenueSubscription + stat.revenueAds, 0),
      avgDailyPlays: data.length > 0 ? data.reduce((sum, stat) => sum + stat.totalPlays, 0) / data.length : 0,
    }

    this.logger.log(`Retrieved daily stats from ${query.startDate} to ${query.endDate}`)

    return {
      data,
      summary,
    }
  }

  async getTrendingSongs(query: GetTrendingSongsQuery) {
    const songs = await this.repository.getTrendingSongs(query.periodType, query.limit)

    if (songs.length === 0) {
      return {
        periodType: query.periodType,
        periodStart: new Date(),
        periodEnd: new Date(),
        songs: [],
      }
    }

    this.logger.log(`Retrieved ${songs.length} trending songs for period ${query.periodType}`)

    return {
      periodType: query.periodType,
      periodStart: songs[0].periodStart,
      periodEnd: songs[0].periodEnd,
      songs,
    }
  }

  async getRevenueStats(query: GetRevenueStatsQuery) {
    const startDate = new Date(query.startDate)
    const endDate = new Date(query.endDate)

    if (startDate > endDate) {
      throw new Error('Start date must be before end date')
    }

    const data = await this.repository.getRevenueStats(startDate, endDate, query.groupBy)

    const summary = {
      totalRevenueSubscription: data.reduce((sum, stat) => sum + stat.revenueSubscription, 0),
      totalRevenueAds: data.reduce((sum, stat) => sum + stat.revenueAds, 0),
      totalRevenue: data.reduce((sum, stat) => sum + stat.totalRevenue, 0),
      totalNewSubscriptions: data.reduce((sum, stat) => sum + stat.newSubscriptions, 0),
    }

    this.logger.log(`Retrieved revenue stats from ${query.startDate} to ${query.endDate} grouped by ${query.groupBy}`)

    return {
      data,
      summary,
    }
  }

  async getUserEngagementStats(query: GetUserEngagementQuery) {
    const startDate = new Date(query.startDate)
    const endDate = new Date(query.endDate)

    if (startDate > endDate) {
      throw new Error('Start date must be before end date')
    }

    const stats = await this.repository.getUserEngagementStats(startDate, endDate)

    this.logger.log(`Retrieved user engagement stats from ${query.startDate} to ${query.endDate}`)

    return stats
  }

  async getDashboardOverview() {
    const overview = await this.repository.getDashboardOverview()

    this.logger.log('Retrieved dashboard overview')

    return overview
  }

  async updateDailyStatistics(date?: Date) {
    const targetDate = date || new Date()
    targetDate.setHours(0, 0, 0, 0)

    try {
      const result = await this.repository.updateDailyStatistics(targetDate)

      this.logger.log(`Updated daily statistics for ${targetDate.toISOString().split('T')[0]}`)

      return {
        success: true,
        date: targetDate,
        stats: {
          totalPlays: Number(result.totalPlays),
          uniqueListeners: result.uniqueListeners,
          premiumUsersCount: result.premiumUsersCount,
          newRegistrations: result.newRegistrations,
          adImpressions: Number(result.adImpressions),
          revenueSubscription: Number(result.revenueSubscription),
          revenueAds: Number(result.revenueAds),
        },
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Failed to update daily statistics: ${err.message}`, err.stack)
      throw error
    }
  }
}
