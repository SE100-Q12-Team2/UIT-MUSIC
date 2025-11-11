import z from 'zod'

export const ArtistSchema = z.object({
  id: z.number().int().positive(),
  artistName: z.string().min(1).max(255),
  biography: z.string().nullable(),
  profileImage: z.string().url().nullable(),
  hasPublicProfile: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const GetArtistQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    hasPublicProfile: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined || val === '') return undefined
        if (val === 'true') return true
        if (val === 'false') return false
        return undefined
      }),
    createdFrom: z.coerce.date().optional(),
    createdTo: z.coerce.date().optional(),
    updatedFrom: z.coerce.date().optional(),
    updatedTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['createdAt', 'updatedAt', 'artistName']).default('updatedAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()

export const GetArtistsResponseSchema = z.object({
  data: z.array(ArtistSchema),
  page: z.number().int(),
  totalPages: z.number().int(),
  totalItems: z.number().int(),
  limit: z.number().int(),
})

export const CreateArtistBodySchema = z
  .object({
    artistName: z.string().min(1).max(255),
    biography: z.string().nullable().optional(),
    profileImage: z.string().url().nullable().optional(),
    hasPublicProfile: z.boolean().default(true),
  })
  .strict()

export const CreateArtistResSchema = ArtistSchema

export const UpdateArtistBodySchema = z
  .object({
    artistName: z.string().min(1).max(255).optional(),
    biography: z.string().nullable().optional(),
    profileImage: z.string().url().nullable().optional(),
    hasPublicProfile: z.boolean().optional(),
  })
  .strict()

export const UpdateArtistResSchema = ArtistSchema

export type ArtistType = z.infer<typeof ArtistSchema>
export type GetArtistQueryType = z.infer<typeof GetArtistQuerySchema>
export type GetArtistsResponseType = z.infer<typeof GetArtistsResponseSchema>
export type CreateArtistBodyType = z.infer<typeof CreateArtistBodySchema>
export type CreateArtistResType = z.infer<typeof CreateArtistResSchema>
export type UpdateArtistBodyType = z.infer<typeof UpdateArtistBodySchema>
export type UpdateArtistResType = z.infer<typeof UpdateArtistResSchema>
