import { z } from 'zod'
import { ResourceSchema } from 'src/shared/types/media.type'

export const GeneratePresignedUrlBodySchema = z.object({
  resource: ResourceSchema.default('uploads'),
  entityId: z.string().optional(),
  fileName: z.string().min(1, { message: 'File name is required' }),
  contentType: z.string().optional(),
  variant: z.string().default('original'),
})

export const ImageUploadBodySchema = z.object({
  resource: ResourceSchema.default('avatars'),
  entityId: z.string().optional(),
  fileName: z.string().min(1, { message: 'File name is required' }),
  contentType: z.string().optional(),
})

export const GeneratePresignedUrlResSchema = z.object({
  ok: z.boolean(),
  presignedUrl: z.string().url(),
  bucket: z.string(),
  key: z.string(),
  publicUrl: z.string().url(),
  contentType: z.string(),
  expiresIn: z.number(),
})

export type GeneratePresignedUrlBodyType = z.infer<typeof GeneratePresignedUrlBodySchema>
export type ImageUploadBodyType = z.infer<typeof ImageUploadBodySchema>
export type GeneratePresignedUrlResType = z.infer<typeof GeneratePresignedUrlResSchema>
