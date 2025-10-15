import z from 'zod'

export const AudioQualityEnum = z.enum(['Q128kbps', 'Q320kbps', 'FLAC', 'Master'])
export const RenditionTypeEnum = z.enum(['MP3', 'HLS'])
