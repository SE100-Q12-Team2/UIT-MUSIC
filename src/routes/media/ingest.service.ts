import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { IngestController } from 'src/routes/media/ingest.controller'
import { IngestCompleteBodyType } from 'src/routes/media/media.model'
import envConfig from 'src/shared/config'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestController.name)
  
  constructor(private prisma: PrismaService) {}
  
  async complete(body: IngestCompleteBodyType, token: string) {
    this.logger.log('HEADER TOKEN:', JSON.stringify(token))
    this.logger.log('ENV TOKEN:', JSON.stringify(envConfig.INGEST_TOKEN))

    if (token.trim() !== envConfig.INGEST_TOKEN.trim()) throw new UnauthorizedException('Bad token')

    let asset = await this.prisma.asset.findUnique({ where: { songId: body.songId } })
    if (!asset) {
      asset = await this.prisma.asset.create({
        data: {
          songId: body.songId,
          bucket: body.masterBucket ?? envConfig.S3_BUCKET_NAME,
          keyMaster: body.masterKey,
          mimeMaster: body.mimeMaster ?? 'application/octet-stream',
          status: body.renditions?.length ? 'Ready' : 'Processing',
          durationSec: body.durationSec ?? null,
          loudnessI: body.loudnessI ?? null,
        },
      })
    }

    await this.prisma.asset.update({
      where: { id: asset.id },
      data: {
        status: body.renditions.length > 0 ? 'Ready' : 'Processing',
        durationSec: body.durationSec ?? undefined,
        loudnessI: body.loudnessI ?? undefined,
        bucket: body.masterBucket ?? undefined,
        keyMaster: body.masterKey ?? undefined,
        mimeMaster: body.mimeMaster ?? undefined,
      },
    })

    for (const r of body.renditions) {
      console.log('Upserting rendition:', r)
      await this.prisma.rendition.upsert({
        where: {
          bucket_key: { bucket: r.bucket, key: r.key },
        },
        create: {
          assetId: asset.id,
          type: r.type as any,
          quality: r.quality as any,
          bitrateKbps: r.bitrateKbps ?? null,
          codec: r.codec ?? null,
          bucket: r.bucket,
          key: r.key,
          mime: r.mime,
          sizeBytes: r.sizeBytes ?? null,
          status: 'Ready',
          hlsSegmentPrefix: r.hlsSegmentPrefix ?? null,
        },
        update: {
          bitrateKbps: r.bitrateKbps ?? null,
          codec: r.codec ?? null,
          mime: r.mime,
          sizeBytes: r.sizeBytes ?? null,
          status: 'Ready',
          hlsSegmentPrefix: r.hlsSegmentPrefix ?? null,
        },
      })
    }

    return { ok: true }
  }
}
