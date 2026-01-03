import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { S3IngestService } from 'src/shared/services/s3.service'
import { GeneratePresignedUrlBodyType, ImageUploadBodyType } from './upload.model'
import { getMediaType } from 'src/shared/lib/files/mime'

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name)

  constructor(private readonly s3Service: S3IngestService) {}

  async generatePresignedUrl(body: GeneratePresignedUrlBodyType, userId?: number) {
    this.logger.log(`Generating presigned URL for resource: ${body.resource}`)

    const ext = body.fileName.split('.').pop()?.toLowerCase()
    if (!ext) {
      throw new BadRequestException('Invalid file name - no extension found')
    }

    const mediaType = getMediaType(ext, body.fileName)

    const result = await this.s3Service.generatePresignedUrl({
      keyParams: {
        resource: body.resource,
        entityId: body.entityId ?? userId?.toString(),
        fileName: body.fileName,
        variant: body.variant,
        mediaType,
      },
      contentType: body.contentType,
      expiresIn: 3600
    })

    this.logger.log(`Presigned URL generated successfully for key: ${result.key}`)
    return result
  }

  async generateImageUploadUrl(body: ImageUploadBodyType, userId?: number) {
    this.logger.log(`Generating image upload URL for resource: ${body.resource}`)

    const ext = body.fileName.split('.').pop()?.toLowerCase()
    const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']

    if (!ext || !allowedImageExtensions.includes(ext)) {
      throw new BadRequestException(`Invalid image file extension. Allowed: ${allowedImageExtensions.join(', ')}`)
    }

    const result = await this.s3Service.generatePresignedUrl({
      keyParams: {
        resource: body.resource,
        entityId: body.entityId ?? userId?.toString(),
        fileName: body.fileName,
        variant: 'original',
        mediaType: 'image',
      },
      contentType: body.contentType,
      expiresIn: 3600,
    })

    this.logger.log(`Image upload URL generated successfully: ${result.publicUrl}`)
    return result
  }

  getPublicUrl(key: string): string {
    return this.s3Service.getPublicUrl(key)
  }
}
