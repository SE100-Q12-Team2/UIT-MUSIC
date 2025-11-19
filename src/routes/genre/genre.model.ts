import z from 'zod'

export const GenreSchema = z.object({
  id: z.number().int().positive(),
  genreName: z.string().min(1).max(100),
  description: z.string().nullish(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const GetGenreQuerySchema = z.object({
  q: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  updatedFrom: z.string().optional(),
  updatedTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'genreName']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const GetGenresResponseSchema = z.object({
  data: z.array(GenreSchema),
  page: z.number().int(),
  totalPages: z.number().int(),
  totalItems: z.number().int(),
  limit: z.number().int(),
})

export const CreateGenreBodySchema = z.object({
  genreName: z.string().min(1).max(100),
  description: z.string().nullish(),
})

export const CreateGenreResSchema = GenreSchema

export const UpdateGenreBodySchema = CreateGenreBodySchema.partial()
export const UpdateGenreResSchema = GenreSchema

export type GenreType = z.infer<typeof GenreSchema>
export type GetGenreQueryType = z.infer<typeof GetGenreQuerySchema>
export type GetGenresResponseType = z.infer<typeof GetGenresResponseSchema>
export type CreateGenreBodyType = z.infer<typeof CreateGenreBodySchema>
export type CreateGenreResType = z.infer<typeof CreateGenreResSchema>
export type UpdateGenreBodyType = z.infer<typeof UpdateGenreBodySchema>
export type UpdateGenreResType = z.infer<typeof UpdateGenreResSchema>
