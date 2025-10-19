import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { PlaylistTracksController } from 'src/routes/playlist-track/playlist-track.controller'
import { PlaylistTracksRepository } from 'src/routes/playlist-track/playlist-track.repo'
import { PlaylistTracksService } from 'src/routes/playlist-track/playlist-track.service'

import { PrismaService } from 'src/shared/services'

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [PlaylistTracksController],
  providers: [PlaylistTracksService, PlaylistTracksRepository, PrismaService],
  exports: [PlaylistTracksService],
})
export class PlaylistTracksModule {}
