import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common'
import env from 'src/shared/config'
import { PrismaService } from 'src/shared/services'
import { IngestCompleteBodySchema, IngestCompleteBodyType } from 'src/routes/media/media.model'

@Controller('internal/ingest')
export class IngestController {
  constructor(private prisma: PrismaService) {}

  @Post('complete')
  async complete(@Body() rawBody: any, @Headers('x-ingest-token') token: string) {
    if (token !== env.INGEST_TOKEN) throw new UnauthorizedException('Bad token')

    const body: IngestCompleteBodyType = IngestCompleteBodySchema.parse(rawBody)

    const asset = await this.prisma.asset.findUnique({ where: { songId: body.songId } })
    if (!asset) return { ok: false, reason: 'asset_not_found' }

    // Cập nhật metadata master nếu Lambda gửi về
    await this.prisma.asset.update({
      where: { id: asset.id },
      data: {
        status: 'Ready',
        durationSec: body.durationSec ?? undefined,
        loudnessI: body.loudnessI ?? undefined,
      },
    })

    // Upsert renditions
    for (const r of body.renditions) {
      await this.prisma.rendition.upsert({
        where: {
          // khóa duy nhất theo thiết kế của bạn
          bucket_key: { bucket: env.S3_BUCKET_NAME, key: r.key },
        },
        create: {
          assetId: asset.id,
          type: r.type as any,
          quality: r.quality as any,
          bitrateKbps: r.bitrateKbps ?? null,
          codec: r.codec ?? null,
          bucket: env.S3_BUCKET_NAME,
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
