import { Controller, Get, Post, Query } from '@nestjs/common'
import { StatisticsService } from './statistics.service'
import {
  GetDailyStatsQueryDto,
  GetTrendingSongsQueryDto,
  GetRevenueStatsQueryDto,
  GetUserEngagementQueryDto,
  DailyStatsListResponseDto,
  TrendingSongsResponseDto,
  RevenueStatsResponseDto,
  UserEngagementStatsDto,
  DashboardOverviewDto,
} from './statistics.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(DashboardOverviewDto)
  async getDashboardOverview() {
    return this.statisticsService.getDashboardOverview()
  }

  @Get('daily')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(DailyStatsListResponseDto)
  async getDailyStats(@Query() query: GetDailyStatsQueryDto) {
    return this.statisticsService.getDailyStats(query)
  }

  @Get('trending')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(TrendingSongsResponseDto)
  async getTrendingSongs(@Query() query: GetTrendingSongsQueryDto) {
    return this.statisticsService.getTrendingSongs(query)
  }

  @Get('revenue')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(RevenueStatsResponseDto)
  async getRevenueStats(@Query() query: GetRevenueStatsQueryDto) {
    return this.statisticsService.getRevenueStats(query)
  }

  @Get('engagement')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(UserEngagementStatsDto)
  async getUserEngagementStats(@Query() query: GetUserEngagementQueryDto) {
    return this.statisticsService.getUserEngagementStats(query)
  }

  @Post('update-daily')
  @Auth([AuthType.Bearer])
  async updateDailyStatistics() {
    return this.statisticsService.updateDailyStatistics()
  }
}
