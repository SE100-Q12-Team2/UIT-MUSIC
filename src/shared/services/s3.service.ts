// src/modules/media/media.s3.ts
import { Injectable, BadRequestException } from '@nestjs/common'
import { S3, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import env from 'src/shared/config'
import { randomUUID } from 'crypto'
import { KeyParams, PresignParams, UploadFileParams } from 'src/shared/types/media.type'
import { guessContentType } from 'src/shared/lib'

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

  makeKey(params: KeyParams): string {
    const envName = params.env ?? env.NODE_ENV ?? 'dev'
    const tenant = params.tenant ?? 'app'
    const uid = randomUUID().slice(0, 8)

    let ext = params.ext
    if (!ext && params.fileName) {
      ext = params.fileName.split('.').pop()?.toLowerCase()
    }
    if (!ext) ext = 'jpg'

    const parts = [envName, tenant, params.resource]

    if (params.entityId) {
      parts.push(String(params.entityId))
    }

    const variant = params.variant ?? 'original'
    const filename = `${variant}-${uid}.${ext}`
    parts.push(filename)

    const key = parts.join('/')
    
    console.log('🔑 Generated S3 key:', {
      envName,
      tenant,
      resource: params.resource,
      entityId: params.entityId,
      key,
    })

    return key
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

  async generatePresignedUrl(params: PresignParams) {
    const key = this.makeKey(params.keyParams)

    const contentType = params.contentType ?? guessContentType(params.keyParams.ext, params.keyParams.fileName)
    const cacheControl = params.cacheControl ?? 'public, max-age=31536000, immutable'
    const expiresIn = params.expiresIn ?? 3600

    const cmd = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      CacheControl: cacheControl,
    })

    const presignedUrl = await getSignedUrl(this.s3, cmd, { expiresIn })
    const publicUrl = this.getPublicUrl(key)

    console.log('🔗 Generated presigned URL:', {
      bucket: env.S3_BUCKET_NAME,
      key,
      publicUrl,
      contentType,
    })

    return {
      presignedUrl,
      bucket: env.S3_BUCKET_NAME,
      key,
      contentType,
      cacheControl,
      expiresIn,
      publicUrl,
    }
  }

  async uploadFile(params: UploadFileParams) {
    if (!params.body && !params.filepath) {
      throw new BadRequestException('Either body or filepath must be provided')
    }

    const key = this.makeKey(params.keyParams)
    const contentType = params.contentType ?? guessContentType(params.keyParams.ext, params.keyParams.fileName)
    const cacheControl = params.cacheControl ?? 'public, max-age=31536000, immutable'

    let body: Buffer | Uint8Array | Blob | string | ReadableStream | undefined

    if (params.body) {
      body = params.body
    } else if (params.filepath) {
      // In a real implementation, you'd read the file here
      // For now, we'll throw an error as we need multer or similar
      throw new BadRequestException('File path upload not implemented. Use body or presigned URL')
    }

    const cmd = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })

    await this.s3.send(cmd)

    return {
      bucket: env.S3_BUCKET_NAME,
      key,
      contentType,
      publicUrl: this.getPublicUrl(key),
    }
  }

  getPublicUrl(key: string): string {
    // Always return S3 direct URL for now (not CloudFront)
    // if (env.CF_DOMAIN) {
    //   return `https://${env.CF_DOMAIN}/${encodeURI(key)}`
    // }
    return `https://${env.S3_BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${encodeURI(key)}`
  }
}
