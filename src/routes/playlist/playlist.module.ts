import { Module } from '@nestjs/common'
import { PlaylistController } from 'src/routes/playlist/playlist.controller'
import { PlaylistRepository } from 'src/routes/playlist/playlist.repo'
import { PlaylistService } from 'src/routes/playlist/playlist.service'

@Module({
  providers: [PlaylistService, PlaylistRepository],
  controllers: [PlaylistController],
})
export class PlaylistModule {}
