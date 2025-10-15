import { AudioQualityEnum, RenditionTypeEnum } from 'src/shared/constants/media.constant'
import { EnvSchema, ResourceSchema } from 'src/shared/types/media.type'
import { z } from 'zod'

export const GetPresignedUrlBodySchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  fileSize: z
    .number()
    .max(5 * 1024 * 1024)
    .optional(),
  resource: ResourceSchema.optional(),
  entityId: z.string().optional(),
  variant: z.string().optional(),
  tenant: z.string().optional(),
  env: EnvSchema.optional(),
  cacheControl: z.string().optional(),
  expiresIn: z.number().int().positive().max(3600).optional(),
})

export const GetPresignedUrlResSchema = z.object({
  url: z.string(),
  presignedUrl: z.string(),
  key: z.string(),
  publicUrl: z.string(),
  bucket: z.string(),
  contentType: z.string().optional(),
  expiresIn: z.number(),
})

export const CreateMasterUploadBody = z.object({
  songId: z.number().int().positive(),
  fileName: z.string().min(1),
  ext: z.string().optional(),
  tenant: z.string().default('app'),
})

export const IngestCompleteBody = z.object({
  songId: z.number().int().positive(),
  assetId: z.number().int().positive().optional(),
  masterKey: z.string(),
  durationSec: z.number().int().optional(),
  loudnessI: z.number().optional(),
  renditions: z.array(
    z.object({
      type: RenditionTypeEnum,
      quality: AudioQualityEnum,
      bitrateKbps: z.number().int().optional(),
      codec: z.string().optional(),
      key: z.string(),
      mime: z.string(),
      sizeBytes: z.number().int().optional(),
      hlsSegmentPrefix: z.string().optional(),
    }),
  ),
})

export const GetPlaybackQuery = z.object({
  quality: z.enum(['hls', '320', '128']).default('hls'),
})

export type GetPresignedUrlBodyType = z.infer<typeof GetPresignedUrlBodySchema>
export type GetPresignedUrlResType = z.infer<typeof GetPresignedUrlResSchema>
export type CreateMasterUploadBodyType = z.infer<typeof CreateMasterUploadBody>
export type IngestCompleteBodyType = z.infer<typeof IngestCompleteBody>
export type GetPlaybackQueryType = z.infer<typeof GetPlaybackQuery>
