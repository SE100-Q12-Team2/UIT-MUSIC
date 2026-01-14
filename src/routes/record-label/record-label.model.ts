import { z } from 'zod'

export const GetRecordLabelsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  hasPublicProfile: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined
      if (val === 'true') return true
      if (val === 'false') return false
      return undefined
    }),
  userId: z.coerce.number().int().positive().optional(),
})

export const CreateRecordLabelSchema = z.object({
  labelName: z.string().min(1).max(255),
  labelType: z.enum(['INDIVIDUAL', 'COMPANY']).default('INDIVIDUAL'),
  imageUrl: z.string().url().optional().nullable(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  hasPublicProfile: z.boolean().default(false),
  parentLabelId: z.number().int().positive().optional().nullable(),
})

export const UpdateRecordLabelSchema = z.object({
  labelName: z.string().min(1).max(255).optional(),
  labelType: z.enum(['INDIVIDUAL', 'COMPANY']).optional(),
  imageUrl: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  hasPublicProfile: z.boolean().optional(),
  parentLabelId: z.number().int().positive().nullable().optional(),
})

export const RecordLabelSchema = z.object({
  id: z.number(),
  userId: z.number(),
  labelName: z.string(),
  labelType: z.enum(['INDIVIDUAL', 'COMPANY']),
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  contactEmail: z.string().nullable(),
  hasPublicProfile: z.boolean(),
  parentLabelId: z.number().nullable(),
  createdAt: z.string(),
  user: z
    .object({
      id: z.number(),
      email: z.string(),
      fullName: z.string(),
    })
    .optional(),
  parentLabel: z
    .object({
      id: z.number(),
      labelName: z.string(),
      labelType: z.enum(['INDIVIDUAL', 'COMPANY']),
    })
    .nullable()
    .optional(),
  managedArtists: z
    .array(
      z.object({
        id: z.number(),
        labelName: z.string(),
        imageUrl: z.string().nullable(),
      }),
    )
    .optional(),
  _count: z
    .object({
      albums: z.number(),
      songs: z.number(),
      managedArtists: z.number().optional(),
    })
    .optional(),
})

export const PaginatedRecordLabelsSchema = z.object({
  items: z.array(RecordLabelSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetManagedArtistsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
})

export const AddArtistToCompanySchema = z.object({
  artistLabelId: z.number().int().positive(),
})

// Types
export type GetRecordLabelsQueryType = z.infer<typeof GetRecordLabelsQuerySchema>
export type CreateRecordLabelType = z.infer<typeof CreateRecordLabelSchema>
export type UpdateRecordLabelType = z.infer<typeof UpdateRecordLabelSchema>
export type RecordLabelType = z.infer<typeof RecordLabelSchema>
export type PaginatedRecordLabelsType = z.infer<typeof PaginatedRecordLabelsSchema>
export type GetManagedArtistsQueryType = z.infer<typeof GetManagedArtistsQuerySchema>
export type AddArtistToCompanyType = z.infer<typeof AddArtistToCompanySchema>
