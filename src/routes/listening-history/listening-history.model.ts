import { AudioQualityEnum } from 'src/shared/constants/media.constant'
import { z } from 'zod'

export const ListeningHistorySchema = z.object({
  id: z.number(),
  userId: z.number(),
  songId: z.number(),
  playedAt: z.string(),
  durationListened: z.number().nullable(),
  audioQuality: AudioQualityEnum.nullable(),
  deviceInfo: z.string().max(255).nullable(),
})

export const ListeningHistoryResponseSchema = ListeningHistorySchema.extend({
  song: z.object({
    id: z.number(),
    title: z.string(),
    duration: z.number(),
    coverImageUrl: z.string().nullable(),
    albumId: z.number().nullable(),
  }),
})

export const ListeningHistoryWithDetailsSchema = ListeningHistoryResponseSchema.extend({
  song: z.object({
    id: z.number(),
    title: z.string(),
    duration: z.number(),
    coverImageUrl: z.string().nullable(),
    album: z
      .object({
        id: z.number(),
        title: z.string(),
        coverImageUrl: z.string().nullable(),
      })
      .nullable(),
    artists: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        role: z.string(),
      }),
    ),
  }),
})

export const PaginatedListeningHistoryResponseSchema = z.object({
  data: z.array(ListeningHistoryWithDetailsSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const CreateListeningHistorySchema = z
  .object({
    songId: z.number().int().positive(),
    durationListened: z.number().int().min(0).optional(),
    audioQuality: AudioQualityEnum.optional(),
    deviceInfo: z.string().max(255).optional(),
  })
  .strict()

export const TrackSongResponseSchema = z.object({
  id: z.number(),
  playedAt: z.string(),
})

export const ClearHistoryResponseSchema = z.object({
  deletedCount: z.number(),
})

export const GetListeningHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    songId: z.coerce.number().int().positive().optional(),
  })
  .strict()

export const GetUserStatsQuerySchema = z
  .object({
    period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict()

export const UserListeningStatsSchema = z.object({
  totalListeningTime: z.number(),
  totalSongsPlayed: z.number(),
  averageListeningTime: z.number(),
  topGenres: z.array(
    z.object({
      genre: z.string(),
      count: z.number(),
      percentage: z.number(),
    }),
  ),
  topArtists: z.array(
    z.object({
      artistId: z.number(),
      artistName: z.string(),
      playCount: z.number(),
    }),
  ),
  topSongs: z.array(
    z.object({
      songId: z.number(),
      songTitle: z.string(),
      playCount: z.number(),
      totalDuration: z.number(),
    }),
  ),
  listeningByHour: z.array(
    z.object({
      hour: z.number(),
      count: z.number(),
    }),
  ),
  listeningByDay: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
      totalDuration: z.number(),
    }),
  ),
})

export const RecentlyPlayedResponseSchema = z.object({
  data: z.array(
    z.object({
      songId: z.number(),
      title: z.string(),
      coverImageUrl: z.string().nullable(),
      lastPlayedAt: z.string(),
      playCount: z.number(),
      artists: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
        }),
      ),
    }),
  ),
  totalItems: z.number(),
})

export type ListeningHistoryType = z.infer<typeof ListeningHistorySchema>
export type ListeningHistoryResponseType = z.infer<typeof ListeningHistoryResponseSchema>
export type ListeningHistoryWithDetailsType = z.infer<typeof ListeningHistoryWithDetailsSchema>
export type PaginatedListeningHistoryResponseType = z.infer<typeof PaginatedListeningHistoryResponseSchema>
export type CreateListeningHistoryType = z.infer<typeof CreateListeningHistorySchema>
export type TrackSongResponseType = z.infer<typeof TrackSongResponseSchema>
export type ClearHistoryResponseType = z.infer<typeof ClearHistoryResponseSchema>
export type GetListeningHistoryQueryType = z.infer<typeof GetListeningHistoryQuerySchema>
export type GetUserStatsQueryType = z.infer<typeof GetUserStatsQuerySchema>
export type UserListeningStatsType = z.infer<typeof UserListeningStatsSchema>
export type RecentlyPlayedResponseType = z.infer<typeof RecentlyPlayedResponseSchema>
