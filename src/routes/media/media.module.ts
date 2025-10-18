import { Module } from '@nestjs/common'
import { AssetController } from 'src/routes/media/asset.controller'
import { AssetService } from 'src/routes/media/asset.service'
import { IngestController } from 'src/routes/media/ingest.controller'
import { IngestService } from 'src/routes/media/ingest.service'
import { PlaybackController } from 'src/routes/media/playback.controller'
import { PlaybackService } from 'src/routes/media/playback.service'
import { PrismaService } from 'src/shared/services'
import { S3IngestService } from 'src/shared/services/s3.service'

@Module({
  controllers: [AssetController, IngestController, PlaybackController],
  providers: [PrismaService, S3IngestService, AssetService, PlaybackService, IngestService],
})
export class MediaModule {}
