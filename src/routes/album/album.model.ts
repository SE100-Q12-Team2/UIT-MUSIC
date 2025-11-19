import { z } from 'zod'
import { AlbumOrder } from 'src/shared/constants/album.constant'

export const GetAlbumsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  labelId: z.coerce.number().int().positive().optional(),
  order: z
    .enum([AlbumOrder.LATEST, AlbumOrder.OLDEST, AlbumOrder.TITLE, AlbumOrder.RELEASE_DATE])
    .default(AlbumOrder.LATEST),
  search: z.string().optional(),
})

export const CreateAlbumSchema = z.object({
  albumTitle: z.string().min(1).max(255),
  albumDescription: z.string().optional(),
  coverImage: z.string().max(500).optional(),
  releaseDate: z.string().optional(),
  totalTracks: z.number().int().min(0).default(0),
})

export const UpdateAlbumSchema = z.object({
  albumTitle: z.string().min(1).max(255).optional(),
  albumDescription: z.string().nullable().optional(),
  coverImage: z.string().max(500).nullable().optional(),
  releaseDate: z.string().nullable().optional(),
  totalTracks: z.number().int().min(0).optional(),
})

export const AlbumSongSchema = z.object({
  id: z.number(),
  title: z.string(),
  duration: z.number(),
  playCount: z.number(),
  uploadDate: z.string(),
  songArtists: z
    .array(
      z.object({
        role: z.string(),
        artist: z.object({
          id: z.number(),
          artistName: z.string(),
          profileImage: z.string().nullable(),
        }),
      }),
    )
    .optional(),
})

export const AlbumSchema = z.object({
  id: z.number(),
  albumTitle: z.string(),
  albumDescription: z.string().nullable(),
  coverImage: z.string().nullable(),
  releaseDate: z.string().nullable(),
  labelId: z.number().nullable(),
  totalTracks: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  label: z
    .object({
      id: z.number(),
      labelName: z.string(),
      hasPublicProfile: z.boolean(),
    })
    .nullable()
    .optional(),
  songs: z.array(AlbumSongSchema).optional(),
  _count: z
    .object({
      songs: z.number(),
    })
    .optional(),
})

export const PaginatedAlbumsSchema = z.object({
  items: z.array(AlbumSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export type GetAlbumsQueryType = z.infer<typeof GetAlbumsQuerySchema>
export type CreateAlbumType = z.infer<typeof CreateAlbumSchema>
export type UpdateAlbumType = z.infer<typeof UpdateAlbumSchema>
export type AlbumType = z.infer<typeof AlbumSchema>
export type AlbumSongType = z.infer<typeof AlbumSongSchema>
export type PaginatedAlbumsType = z.infer<typeof PaginatedAlbumsSchema>
