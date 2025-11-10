import { z } from 'zod'
import { SongOrder } from 'src/shared/constants/song.constant'

export const GetSongsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  genreId: z.coerce.number().int().positive().optional(),
  artistId: z.coerce.number().int().positive().optional(),
  albumId: z.coerce.number().int().positive().optional(),
  labelId: z.coerce.number().int().positive().optional(),
  language: z.string().max(50).optional(),
  order: z.enum([SongOrder.LATEST, SongOrder.POPULAR, SongOrder.TITLE]).default(SongOrder.LATEST),
})

export const GetTrendingSongsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  genreId: z.coerce.number().int().positive().optional(),
})

export const IncrementPlayCountSchema = z.object({
  songId: z.coerce.number().int().positive(),
})

export const SongArtistAssignmentSchema = z.object({
  artistId: z.number().int().positive(),
  role: z.enum(['MainArtist', 'FeaturedArtist', 'Composer', 'Producer']).default('MainArtist'),
})

export const CreateSongSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  duration: z.number().int().positive(),
  language: z.string().max(50).optional(),
  lyrics: z.string().optional(),
  albumId: z.number().int().positive().optional(),
  genreId: z.number().int().positive().optional(),
  artists: z.array(SongArtistAssignmentSchema).min(1, 'At least one artist is required'),
})

export const UpdateSongSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  duration: z.number().int().positive().optional(),
  language: z.string().max(50).optional(),
  lyrics: z.string().optional(),
  albumId: z.number().int().positive().nullable().optional(),
  genreId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
})

export const UpdateSongArtistsSchema = z.object({
  artists: z.array(SongArtistAssignmentSchema).min(1, 'At least one artist is required'),
})

export const SongArtistSchema = z.object({
  artistId: z.number(),
  songId: z.number(),
  role: z.enum(['MainArtist', 'FeaturedArtist', 'Composer', 'Producer']),
  artist: z.object({
    id: z.number(),
    artistName: z.string(),
    profileImage: z.string().nullable(),
  }),
})

export const SongSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  duration: z.number(),
  language: z.string().nullable(),
  lyrics: z.string().nullable(),
  albumId: z.number().nullable(),
  genreId: z.number().nullable(),
  labelId: z.number(),
  uploadDate: z.date(),
  isActive: z.boolean(),
  copyrightStatus: z.enum(['Clear', 'Disputed', 'Violation']),
  playCount: z.number(),
  isFavorite: z.boolean().optional(),
  songArtists: z.array(SongArtistSchema).optional(),
  album: z
    .object({
      id: z.number(),
      albumTitle: z.string(),
      coverImage: z.string().nullable(),
    })
    .nullable()
    .optional(),
  genre: z
    .object({
      id: z.number(),
      genreName: z.string(),
    })
    .nullable()
    .optional(),
  label: z
    .object({
      id: z.number(),
      labelName: z.string(),
    })
    .optional(),
  asset: z
    .object({
      id: z.number(),
      bucket: z.string(),
      keyMaster: z.string(),
    })
    .nullable()
    .optional(),
})

export const PaginatedSongsSchema = z.object({
  items: z.array(SongSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const SongCreatedSchema = z.object({
  id: z.number(),
  title: z.string(),
  message: z.string(),
})

export const SongUpdatedSchema = z.object({
  id: z.number(),
  message: z.string(),
})

export const PlayCountIncrementedSchema = z.object({
  songId: z.number(),
  playCount: z.number(),
  message: z.string(),
})

export const TrendingSongsSchema = z.object({
  trending: z.array(SongSchema),
})

export type GetSongsQueryType = z.infer<typeof GetSongsQuerySchema>
export type GetTrendingSongsQueryType = z.infer<typeof GetTrendingSongsQuerySchema>
export type IncrementPlayCountType = z.infer<typeof IncrementPlayCountSchema>
export type CreateSongType = z.infer<typeof CreateSongSchema>
export type UpdateSongType = z.infer<typeof UpdateSongSchema>
export type UpdateSongArtistsType = z.infer<typeof UpdateSongArtistsSchema>
export type SongType = z.infer<typeof SongSchema>
export type PaginatedSongsType = z.infer<typeof PaginatedSongsSchema>
