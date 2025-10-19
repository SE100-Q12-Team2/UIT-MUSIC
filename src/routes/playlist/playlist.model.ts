import z from 'zod'

export const PlaylistSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  playlistName: z.string().min(1).max(255),
  description: z.string().nullable(),
  tags: z.string().array().default([]),
  coverImageUrl: z.string().nullable(),
  isFavorite: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const PlaylistSongSchema = z.object({
  id: z.number().int().positive(),
  playlistId: z.number().int().positive(),
  songId: z.number().int().positive(),
  position: z.number().int(),
  addedAt: z.date(),
})

export const FavoriteSchema = z.object({
  userId: z.number().int().positive(),
  trackId: z.number().int().positive(),
  likedAt: z.date(),
})

export const GetPlaylistQuerySchema = z.object({
  q: z.string().trim().optional(), //title, description, tags
  ownerId: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.string().array().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  page: z.number().int().min(1).default(1),
  sort: z.enum(['createdAt', 'playlistName', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const GetPlaylistsResponseSchema = z.object({
  data: z.array(PlaylistSchema),
  page: z.number().int(),
  totalPages: z.number().int(),
  totalItems: z.number().int(),
  limit: z.number().int(),
})

export const CreatePlaylistBodySchema = PlaylistSchema.pick({
  userId: true,
  coverImageUrl: true,
  tags: true,
  description: true,
  isPublic: true,
  playlistName: true,
})
export const CreatePlaylistResSchema = PlaylistSchema

export const UpdatePlaylistBodySchema = CreatePlaylistBodySchema.partial()
export const UpdatePlaylistResSchema = PlaylistSchema

export type PlaylistType = z.infer<typeof PlaylistSchema>
export type PlaylistSongType = z.infer<typeof PlaylistSongSchema>

export type GetAllPlaylistResType = z.infer<typeof GetPlaylistsResponseSchema>
export type GetPlaylistQueryType = z.infer<typeof GetPlaylistQuerySchema>

export type FavoriteType = z.infer<typeof FavoriteSchema>

export type CreatePlaylistBodyType = z.infer<typeof CreatePlaylistBodySchema>
export type CreatePlaylistResType = z.infer<typeof CreatePlaylistResSchema>

export type UpdatePlaylistBodyType = z.infer<typeof UpdatePlaylistBodySchema>
export type UpdatePlaylistResType = z.infer<typeof UpdatePlaylistResSchema>
