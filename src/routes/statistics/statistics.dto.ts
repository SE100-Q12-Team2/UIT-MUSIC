import { createZodDto } from 'nestjs-zod'
import {
  GetDailyStatsQuerySchema,
  GetTrendingSongsQuerySchema,
  GetRevenueStatsQuerySchema,
  GetUserEngagementQuerySchema,
  DailyStatsListResponseSchema,
  TrendingSongsResponseSchema,
  RevenueStatsResponseSchema,
  UserEngagementStatsSchema,
  DashboardOverviewSchema,
} from './statistics.model'

export class GetDailyStatsQueryDto extends createZodDto(GetDailyStatsQuerySchema) {}
export class GetTrendingSongsQueryDto extends createZodDto(GetTrendingSongsQuerySchema) {}
export class GetRevenueStatsQueryDto extends createZodDto(GetRevenueStatsQuerySchema) {}
export class GetUserEngagementQueryDto extends createZodDto(GetUserEngagementQuerySchema) {}

export class DailyStatsListResponseDto extends createZodDto(DailyStatsListResponseSchema) {}
export class TrendingSongsResponseDto extends createZodDto(TrendingSongsResponseSchema) {}
export class RevenueStatsResponseDto extends createZodDto(RevenueStatsResponseSchema) {}
export class UserEngagementStatsDto extends createZodDto(UserEngagementStatsSchema) {}
export class DashboardOverviewDto extends createZodDto(DashboardOverviewSchema) {}
