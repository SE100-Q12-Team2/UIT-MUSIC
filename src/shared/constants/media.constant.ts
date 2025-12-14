import z from 'zod'

export const AudioQualityEnum = z.enum([
  'Q128kbps',
  'Q320kbps',
  'FLAC',
  'MASTER',
])
export const RenditionTypeEnum = z.enum(['MP3', 'HLS'])

export const ReviewMediaType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
} as const

export const MediaType = {
  IMAGE: 'image',
  VIDEO: 'video',
  UNKNOWN: 'unknown',
}

export const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv', 'm4v'] as const
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'] as const

export type ReviewMediaTypeType = (typeof ReviewMediaType)[keyof typeof ReviewMediaType]
