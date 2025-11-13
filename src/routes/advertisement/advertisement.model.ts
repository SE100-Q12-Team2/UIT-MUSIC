import { z } from 'zod'
import { AdType } from '@prisma/client'

export const AdTypeEnum = z.enum(AdType)

export const TargetAudienceSchema = z.object({
  ageRange: z
    .object({
      min: z.number().int().min(13).optional(),
      max: z.number().int().max(100).optional(),
    })
    .optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'All']).optional(),
  subscriptionType: z.enum(['Free', 'Premium', 'All']).optional().default('Free'),
  genres: z.array(z.number().int().positive()).optional(),
  countries: z.array(z.string()).optional(),
})

export const AdvertisementSchema = z.object({
  id: z.number().int().positive(),
  adName: z.string(),
  adType: AdTypeEnum,
  filePath: z.string().nullable(),
  duration: z.number().int().positive().nullable(),
  targetAudience: TargetAudienceSchema.nullable(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean(),
  createdAt: z.date(),
})

export const CreateAdvertisementSchema = z.object({
  adName: z.string().min(1).max(255),
  adType: AdTypeEnum,
  filePath: z.string().max(500).optional(),
  duration: z.number().int().positive().optional(),
  targetAudience: TargetAudienceSchema.optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  isActive: z.boolean().optional().default(true),
})

export const UpdateAdvertisementSchema = z.object({
  adName: z.string().min(1).max(255).optional(),
  adType: AdTypeEnum.optional(),
  filePath: z.string().max(500).optional(),
  duration: z.number().int().positive().optional(),
  targetAudience: TargetAudienceSchema.optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  isActive: z.boolean().optional(),
})

export const QueryAdvertisementsSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10)),
  adType: AdTypeEnum.optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
})

export const AdImpressionSchema = z.object({
  id: z.number().int().positive(),
  adId: z.number().int().positive(),
  userId: z.number().int().positive().nullable(),
  displayedAt: z.date(),
  clicked: z.boolean(),
})

export const CreateAdImpressionSchema = z.object({
  adId: z.number().int().positive(),
  userId: z.number().int().positive().optional(),
  clicked: z.boolean().optional().default(false),
})

export const TrackAdClickSchema = z.object({
  impressionId: z.number().int().positive(),
})

export const AdvertisementResponseSchema = AdvertisementSchema.extend({
  _count: z
    .object({
      impressions: z.number().int().nonnegative(),
    })
    .optional(),
})

export const AdvertisementListResponseSchema = z.object({
  data: z.array(AdvertisementResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export const AdvertisementStatsSchema = z.object({
  totalImpressions: z.number().int().nonnegative(),
  totalClicks: z.number().int().nonnegative(),
  clickThroughRate: z.number().nonnegative(),
  uniqueViewers: z.number().int().nonnegative(),
  impressionsByType: z.record(AdTypeEnum, z.number().int().nonnegative()),
  topPerformingAds: z.array(
    z.object({
      id: z.number().int().positive(),
      adName: z.string(),
      adType: AdTypeEnum,
      impressions: z.number().int().nonnegative(),
      clicks: z.number().int().nonnegative(),
      ctr: z.number().nonnegative(),
    }),
  ),
})

export const GetActiveAdsSchema = z.object({
  limit: z
    .string()
    .optional()
    .default('5')
    .transform((val) => parseInt(val, 10)),
  adType: AdTypeEnum.optional(),
})

export type Advertisement = z.infer<typeof AdvertisementSchema>
export type CreateAdvertisementDto = z.infer<typeof CreateAdvertisementSchema>
export type UpdateAdvertisementDto = z.infer<typeof UpdateAdvertisementSchema>
export type QueryAdvertisementsDto = z.infer<typeof QueryAdvertisementsSchema>
export type AdImpression = z.infer<typeof AdImpressionSchema>
export type CreateAdImpressionDto = z.infer<typeof CreateAdImpressionSchema>
export type TrackAdClickDto = z.infer<typeof TrackAdClickSchema>
export type AdvertisementResponse = z.infer<typeof AdvertisementResponseSchema>
export type AdvertisementListResponse = z.infer<typeof AdvertisementListResponseSchema>
export type AdvertisementStats = z.infer<typeof AdvertisementStatsSchema>
export type GetActiveAdsDto = z.infer<typeof GetActiveAdsSchema>
export type TargetAudience = z.infer<typeof TargetAudienceSchema>
