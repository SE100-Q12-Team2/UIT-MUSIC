import { createZodDto } from 'nestjs-zod'
import { GeneratePresignedUrlBodySchema, GeneratePresignedUrlResSchema, ImageUploadBodySchema } from './upload.model'

export class GeneratePresignedUrlBodyDTO extends createZodDto(GeneratePresignedUrlBodySchema) {}

export class GeneratePresignedUrlResDTO extends createZodDto(GeneratePresignedUrlResSchema) {}

export class ImageUploadBodyDTO extends createZodDto(ImageUploadBodySchema) {}
