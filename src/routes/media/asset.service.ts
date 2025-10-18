import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services'
import { S3IngestService } from 'src/shared/services/s3.service'

@Injectable()
export class AssetService {
  constructor(
    private prisma: PrismaService,
    private s3Ingest: S3IngestService,
  ) {}

  private guessMime(fileName: string) {
    const ext = (fileName.split('.').pop() ?? '').toLowerCase()
    if (ext === 'flac') return 'audio/flac'
    if (ext === 'wav') return 'audio/wav'
    if (ext === 'mp3') return 'audio/mpeg'
    return 'application/octet-stream'
  }

  async createMasterUpload(songId: number, fileName: string, tenant = 'app') {
    const song = await this.prisma.song.findUnique({ where: { id: songId } })
    if (!song) throw new NotFoundException('Song not found')

    const key = this.s3Ingest.makeMasterKey(songId, fileName, tenant)
    const { presignedUrl, bucket } = await this.s3Ingest.createPresignedPutUrl(key)

    const asset = await this.prisma.asset.upsert({
      where: { songId: songId },
      create: {
        songId,
        bucket,
        keyMaster: key,
        mimeMaster: this.guessMime(fileName),
        status: 'Uploaded',
      },
      update: {
        bucket,
        keyMaster: key,
        mimeMaster: this.guessMime(fileName),
        status: 'Uploaded',
      },
    })

    return { presignedUrl, bucket, key, assetId: asset.id }
  }
}
