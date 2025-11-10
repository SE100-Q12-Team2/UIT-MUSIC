import { z } from 'zod'

export const GetRecordLabelsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  hasPublicProfile: z.coerce.boolean().optional(),
  userId: z.coerce.number().int().positive().optional(),
})

export const CreateRecordLabelSchema = z.object({
  labelName: z.string().min(1).max(255),
  description: z.string().optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  hasPublicProfile: z.boolean().default(false),
})

export const UpdateRecordLabelSchema = z.object({
  labelName: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  hasPublicProfile: z.boolean().optional(),
})

export const RecordLabelSchema = z.object({
  id: z.number(),
  userId: z.number(),
  labelName: z.string(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  contactEmail: z.string().nullable(),
  hasPublicProfile: z.boolean(),
  createdAt: z.date(),
  user: z
    .object({
      id: z.number(),
      email: z.string(),
      fullName: z.string(),
    })
    .optional(),
  _count: z
    .object({
      albums: z.number(),
      songs: z.number(),
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

// Types
export type GetRecordLabelsQueryType = z.infer<typeof GetRecordLabelsQuerySchema>
export type CreateRecordLabelType = z.infer<typeof CreateRecordLabelSchema>
export type UpdateRecordLabelType = z.infer<typeof UpdateRecordLabelSchema>
export type RecordLabelType = z.infer<typeof RecordLabelSchema>
export type PaginatedRecordLabelsType = z.infer<typeof PaginatedRecordLabelsSchema>
