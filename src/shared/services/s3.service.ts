// src/modules/media/media.s3.ts
import { Injectable, BadRequestException } from '@nestjs/common'
import { S3, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import env from 'src/shared/config'
import { randomUUID } from 'crypto'

@Injectable()
export class S3IngestService {
  private s3 = new S3({
    region: env.S3_REGION,
    credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
  })

  makeMasterKey(songId: number, fileName: string, tenant = 'app') {
    const envName = env.NODE_ENV ?? 'dev'
    const uid = randomUUID().slice(0, 8)
    const ext = (fileName.split('.').pop() ?? 'mp3').toLowerCase()
    return `${envName}/${tenant}/track/${songId}/master-${uid}.${ext}`
  }

  async createPresignedPutUrl(key: string, contentType?: string, expires = 1800) {
    const cmd = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType ?? 'application/octet-stream',
    })

    const presignedUrl = await getSignedUrl(this.s3, cmd, { expiresIn: expires })
    return { presignedUrl, bucket: env.S3_BUCKET_NAME, key, contentType, expiresIn: expires }
  }
}
