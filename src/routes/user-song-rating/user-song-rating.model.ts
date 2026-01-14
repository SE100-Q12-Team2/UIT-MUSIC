import { z } from 'zod'
import { Rating } from '@prisma/client'

export const RatingEnum = z.nativeEnum(Rating)

export const UserSongRatingSchema = z.object({
  userId: z.number().int().positive(),
  songId: z.number().int().positive(),
  rating: RatingEnum,
  comment: z.string().optional(),
  ratedAt: z.string(),
})

export const CreateRatingSchema = z.object({
  songId: z.number().int().positive(),
  rating: RatingEnum,
  comment: z.string().optional(),
})

export const UpdateRatingSchema = z.object({
  rating: RatingEnum,
  comment: z.string().optional(),
})

export const QueryUserRatingsSchema = z.object({
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
  rating: RatingEnum.optional(),
  sortBy: z.enum(['ratedAt', 'songTitle']).optional().default('ratedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const RatingResponseSchema = UserSongRatingSchema.extend({
  song: z
    .object({
      id: z.number().int().positive(),
      title: z.string(),
      duration: z.number().int(),
      artist: z.string().optional(),
      album: z
        .object({
          id: z.number().int().positive(),
          albumTitle: z.string(),
          coverImage: z.string().nullable(),
        })
        .optional()
        .nullable(),
    })
    .optional(),
})

export const RatingListResponseSchema = z.object({
  data: z.array(RatingResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export const SongRatingStatsSchema = z.object({
  songId: z.number().int().positive(),
  totalRatings: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  dislikes: z.number().int().nonnegative(),
  likePercentage: z.number().nonnegative(),
  dislikePercentage: z.number().nonnegative(),
  userRating: RatingEnum.nullable(),
})

export const UserRatingStatsSchema = z.object({
  totalRatings: z.number().int().nonnegative(),
  totalLikes: z.number().int().nonnegative(),
  totalDislikes: z.number().int().nonnegative(),
  recentlyRated: z.array(
    z.object({
      songId: z.number().int().positive(),
      songTitle: z.string(),
      rating: RatingEnum,
      ratedAt: z.string(),
    }),
  ),
})

export type UserSongRating = z.infer<typeof UserSongRatingSchema>
export type CreateRatingDto = z.infer<typeof CreateRatingSchema>
export type UpdateRatingDto = z.infer<typeof UpdateRatingSchema>
export type QueryUserRatingsDto = z.infer<typeof QueryUserRatingsSchema>
export type RatingResponse = z.infer<typeof RatingResponseSchema>
export type RatingListResponse = z.infer<typeof RatingListResponseSchema>
export type SongRatingStats = z.infer<typeof SongRatingStatsSchema>
export type UserRatingStats = z.infer<typeof UserRatingStatsSchema>
