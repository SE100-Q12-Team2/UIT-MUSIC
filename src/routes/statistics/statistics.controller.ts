import { Controller, Get, Post, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiUnauthorizedResponse } from '@nestjs/swagger'
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

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  private readonly logger = new Logger(StatisticsController.name)

  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(DashboardOverviewDto)
  @ApiOperation({
    summary: 'Get dashboard overview',
    description: 'Retrieve overall platform statistics including user counts, song plays, revenue, and engagement metrics. Admin only.',
  })
  @ApiOkResponse({ description: 'Dashboard overview retrieved', type: DashboardOverviewDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async getDashboardOverview() {
    try {
      this.logger.log('Get dashboard overview')
      const result = await this.statisticsService.getDashboardOverview()
      return result
    } catch (error) {
      this.logger.error('Failed to get dashboard overview', error.stack)
      throw error
    }
  }

  @Get('daily')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(DailyStatsListResponseDto)
  @ApiOperation({
    summary: 'Get daily statistics',
    description: 'Retrieve daily aggregated statistics with optional date range filtering. Admin only.',
  })
  @ApiOkResponse({ description: 'Daily statistics retrieved', type: DailyStatsListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async getDailyStats(@Query() query: GetDailyStatsQueryDto) {
    try {
      this.logger.log(`Get daily stats: ${JSON.stringify(query)}`)
      const result = await this.statisticsService.getDailyStats(query)
      return result
    } catch (error) {
      this.logger.error('Failed to get daily stats', error.stack)
      throw error
    }
  }

  @Get('trending')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(TrendingSongsResponseDto)
  @ApiOperation({
    summary: 'Get trending songs',
    description: 'Retrieve most played and trending songs based on play counts and engagement. Admin only.',
  })
  @ApiOkResponse({ description: 'Trending songs retrieved', type: TrendingSongsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async getTrendingSongs(@Query() query: GetTrendingSongsQueryDto) {
    try {
      this.logger.log('Get trending songs')
      const result = await this.statisticsService.getTrendingSongs(query)
      return result
    } catch (error) {
      this.logger.error('Failed to get trending songs', error.stack)
      throw error
    }
  }

  @Get('revenue')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(RevenueStatsResponseDto)
  @ApiOperation({
    summary: 'Get revenue statistics',
    description: 'Retrieve revenue statistics including subscription income, transaction volumes, and trends. Admin only.',
  })
  @ApiOkResponse({ description: 'Revenue statistics retrieved', type: RevenueStatsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async getRevenueStats(@Query() query: GetRevenueStatsQueryDto) {
    try {
      this.logger.log('Get revenue stats')
      const result = await this.statisticsService.getRevenueStats(query)
      return result
    } catch (error) {
      this.logger.error('Failed to get revenue stats', error.stack)
      throw error
    }
  }

  @Get('engagement')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UserEngagementStatsDto)
  @ApiOperation({
    summary: 'Get user engagement statistics',
    description: 'Retrieve user engagement metrics including active users, session duration, and interaction patterns. Admin only.',
  })
  @ApiOkResponse({ description: 'User engagement statistics retrieved', type: UserEngagementStatsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async getUserEngagementStats(@Query() query: GetUserEngagementQueryDto) {
    try {
      this.logger.log('Get user engagement stats')
      const result = await this.statisticsService.getUserEngagementStats(query)
      return result
    } catch (error) {
      this.logger.error('Failed to get engagement stats', error.stack)
      throw error
    }
  }

  @Post('update-daily')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update daily statistics',
    description: 'Manually trigger daily statistics aggregation job. Admin only.',
  })
  @ApiCreatedResponse({ description: 'Daily statistics updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async updateDailyStatistics() {
    try {
      this.logger.log('Trigger daily statistics update')
      const result = await this.statisticsService.updateDailyStatistics()
      this.logger.log('Daily statistics updated')
      return result
    } catch (error) {
      this.logger.error('Failed to update daily statistics', error.stack)
      throw error
    }
  }
}
