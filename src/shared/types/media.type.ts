import { z } from 'zod'

export type MediaType = 'image' | 'video' | 'unknown'

export type KeyParams = {
  env?: 'dev' | 'stg' | 'prod'
  tenant?: string
  resource: string
  /** userId / productId ... (tuỳ resource), có thể bỏ nếu không gắn entity */
  entityId?: string | number
  /** ví dụ: 'original' | 'thumb-256' | 'large-1024' | 'webp' ... */
  variant?: string
  /** đuôi file: 'jpg' | 'png' | 'webp' ... (nếu không truyền, sẽ suy từ fileName) */
  ext?: string
  /** nếu truyền fileName gốc, sẽ suy ra ext nếu thiếu */
  fileName?: string
  mediaType?: MediaType
}

export interface UploadFileParams {
  keyParams: KeyParams
  filepath?: string
  body?: Buffer | Uint8Array | Blob | string | ReadableStream
  contentType?: string
  cacheControl?: string
  partSizeMB?: number // Video nên dùng part lớn hơn (10-50MB)
  queueSize?: number // Video có thể tăng queue size
  onProgress?: (progress: { loaded?: number; total?: number; part?: number }) => void
}

export type PresignParams = {
  /** client sẽ PUT trực tiếp lên S3 */
  keyParams: KeyParams
  /** content-type mong muốn khi PUT */
  contentType?: string
  /** Cache-Control mong muốn gán cho object */
  cacheControl?: string
  /** thời gian sống của presigned url (giây) */
  expiresIn?: number
}

export interface VideoUploadParams extends UploadFileParams {
  keyParams: KeyParams & { mediaType: 'video' }
  // Video-specific options
  generateThumbnail?: boolean // Tạo thumbnail tự động
  thumbnailTime?: number // Thời điểm tạo thumbnail (seconds)
  maxDuration?: number // Giới hạn độ dài video (seconds)
}

export const EnvSchema = z.enum(['dev', 'stg', 'prod'])

export const ResourceSchema = z.enum(['uploads', 'products', 'categories', 'avatars'])

export const UploadOptsSchema = z.object({
  resource: ResourceSchema.default('uploads'),
  entityId: z.string().optional(),
  variant: z.string().default('original'),
  tenant: z.string().default('app'),
  env: EnvSchema.default('dev'),
  cacheControl: z.string().default('public, max-age=31536000, immutable'),
})

export type UploadOpts = z.infer<typeof UploadOptsSchema>
export type ResourceType = z.infer<typeof ResourceSchema>
export type EnvType = z.infer<typeof EnvSchema>
