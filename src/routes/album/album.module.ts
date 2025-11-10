import { Module } from '@nestjs/common'
import { AlbumController } from './album.controller'
import { AlbumService } from './album.service'
import { AlbumRepository } from './album.repo'

@Module({
  controllers: [AlbumController],
  providers: [AlbumService, AlbumRepository],
  exports: [AlbumService, AlbumRepository],
})
export class AlbumModule {}
