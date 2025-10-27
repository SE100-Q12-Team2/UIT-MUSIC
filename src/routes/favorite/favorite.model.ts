import z from 'zod'

export const FavoriteSchema = z.object({
  userId: z.number().int().positive(),
  songId: z.number().int().positive(),
  likedAt: z.date(),
})

export const FavoriteSongInfoSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  duration: z.number().int(),
  language: z.string().nullable(),
  albumId: z.number().int().nullable(),
  genreId: z.number().int().nullable(),
  uploadDate: z.date(),
  playCount: z.bigint(),
  isActive: z.boolean(),
})

export const GetFavoritesQuerySchema = z.object({
  userId: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  page: z.number().int().min(1).default(1),
  sort: z.enum(['likedAt', 'title', 'playCount']).default('likedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  genreId: z.string().optional(),
  language: z.string().optional(),
})

export const FavoriteWithSongSchema = FavoriteSchema.extend({
  song: FavoriteSongInfoSchema,
})

export const GetFavoritesResponseSchema = z.object({
  data: z.array(FavoriteWithSongSchema),
  page: z.number().int(),
  totalPages: z.number().int(),
  totalItems: z.number().int(),
  limit: z.number().int(),
})

export const AddFavoriteBodySchema = z.object({
  userId: z.number().int().positive(),
  songId: z.number().int().positive(),
})

export const AddFavoriteResSchema = FavoriteSchema

export const CheckFavoriteQuerySchema = z.object({
  userId: z.string(),
  songId: z.string(),
})

export const CheckFavoriteResSchema = z.object({
  isFavorite: z.boolean(),
  likedAt: z.date().nullable(),
})

export type FavoriteType = z.infer<typeof FavoriteSchema>
export type FavoriteSongInfoType = z.infer<typeof FavoriteSongInfoSchema>
export type FavoriteWithSongType = z.infer<typeof FavoriteWithSongSchema>

export type GetFavoritesQueryType = z.infer<typeof GetFavoritesQuerySchema>
export type GetFavoritesResponseType = z.infer<typeof GetFavoritesResponseSchema>

export type AddFavoriteBodyType = z.infer<typeof AddFavoriteBodySchema>
export type AddFavoriteResType = z.infer<typeof AddFavoriteResSchema>

export type CheckFavoriteQueryType = z.infer<typeof CheckFavoriteQuerySchema>
export type CheckFavoriteResType = z.infer<typeof CheckFavoriteResSchema>
