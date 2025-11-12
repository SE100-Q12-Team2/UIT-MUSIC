import { z } from 'zod'
import { PeriodType } from '@prisma/client'

export const PeriodTypeEnum = z.nativeEnum(PeriodType)

export const GetDailyStatsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
})

export const GetTrendingSongsQuerySchema = z.object({
  periodType: PeriodTypeEnum.default(PeriodType.Weekly),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),
})

export const GetRevenueStatsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})

export const GetUserEngagementQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
})

export const DailyStatisticSchema = z.object({
  statDate: z.date(),
  totalPlays: z.number().nonnegative(),
  uniqueListeners: z.number().int().nonnegative(),
  premiumUsersCount: z.number().int().nonnegative(),
  newRegistrations: z.number().int().nonnegative(),
  adImpressions: z.number().nonnegative(),
  revenueSubscription: z.number().nonnegative(),
  revenueAds: z.number().nonnegative(),
  createdAt: z.date(),
})

export const DailyStatsListResponseSchema = z.object({
  data: z.array(DailyStatisticSchema),
  summary: z.object({
    totalPlays: z.number().nonnegative(),
    totalUniqueListeners: z.number().int().nonnegative(),
    totalRevenue: z.number().nonnegative(),
    avgDailyPlays: z.number().nonnegative(),
  }),
})

export const TrendingSongSchema = z.object({
  id: z.number().int().positive(),
  songId: z.number().int().positive(),
  periodType: PeriodTypeEnum,
  periodStart: z.date(),
  periodEnd: z.date(),
  playCount: z.number().nonnegative(),
  rankPosition: z.number().int().positive(),
  song: z.object({
    id: z.number().int().positive(),
    title: z.string(),
    duration: z.number().int().positive(),
    coverImage: z.string().nullable(),
    artists: z
      .array(
        z.object({
          artistId: z.number().int().positive(),
          artistName: z.string(),
          role: z.string(),
        }),
      )
      .optional(),
  }),
})

export const TrendingSongsResponseSchema = z.object({
  periodType: PeriodTypeEnum,
  periodStart: z.date(),
  periodEnd: z.date(),
  songs: z.array(TrendingSongSchema),
})

export const RevenueStatsSchema = z.object({
  period: z.string(),
  revenueSubscription: z.number().nonnegative(),
  revenueAds: z.number().nonnegative(),
  totalRevenue: z.number().nonnegative(),
  newSubscriptions: z.number().int().nonnegative(),
})

export const RevenueStatsResponseSchema = z.object({
  data: z.array(RevenueStatsSchema),
  summary: z.object({
    totalRevenueSubscription: z.number().nonnegative(),
    totalRevenueAds: z.number().nonnegative(),
    totalRevenue: z.number().nonnegative(),
    totalNewSubscriptions: z.number().int().nonnegative(),
  }),
})

export const UserEngagementStatsSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  activeUsers: z.number().int().nonnegative(),
  premiumUsers: z.number().int().nonnegative(),
  freeUsers: z.number().int().nonnegative(),
  avgSessionsPerUser: z.number().nonnegative(),
  avgPlayTimePerUser: z.number().nonnegative(),
  topGenres: z.array(
    z.object({
      genreId: z.number().int().positive(),
      genreName: z.string(),
      playCount: z.number().nonnegative(),
    }),
  ),
})

export const DashboardOverviewSchema = z.object({
  users: z.object({
    total: z.number().int().nonnegative(),
    active: z.number().int().nonnegative(),
    premium: z.number().int().nonnegative(),
    newToday: z.number().int().nonnegative(),
  }),
  content: z.object({
    totalSongs: z.number().int().nonnegative(),
    totalAlbums: z.number().int().nonnegative(),
    totalArtists: z.number().int().nonnegative(),
    totalPlaylists: z.number().int().nonnegative(),
  }),
  engagement: z.object({
    totalPlays: z.number().nonnegative(),
    totalPlayTime: z.number().nonnegative(),
    avgPlaysPerUser: z.number().nonnegative(),
  }),
  revenue: z.object({
    todaySubscription: z.number().nonnegative(),
    todayAds: z.number().nonnegative(),
    monthSubscription: z.number().nonnegative(),
    monthAds: z.number().nonnegative(),
    totalMonth: z.number().nonnegative(),
  }),
})

export type GetDailyStatsQuery = z.infer<typeof GetDailyStatsQuerySchema>
export type GetTrendingSongsQuery = z.infer<typeof GetTrendingSongsQuerySchema>
export type GetRevenueStatsQuery = z.infer<typeof GetRevenueStatsQuerySchema>
export type GetUserEngagementQuery = z.infer<typeof GetUserEngagementQuerySchema>
export type DailyStatistic = z.infer<typeof DailyStatisticSchema>
export type DailyStatsListResponse = z.infer<typeof DailyStatsListResponseSchema>
export type TrendingSong = z.infer<typeof TrendingSongSchema>
export type TrendingSongsResponse = z.infer<typeof TrendingSongsResponseSchema>
export type RevenueStats = z.infer<typeof RevenueStatsSchema>
export type RevenueStatsResponse = z.infer<typeof RevenueStatsResponseSchema>
export type UserEngagementStats = z.infer<typeof UserEngagementStatsSchema>
export type DashboardOverview = z.infer<typeof DashboardOverviewSchema>
