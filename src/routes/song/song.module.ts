import { Module } from '@nestjs/common'
import { SongController } from './song.controller'
import { SongService } from './song.service'
import { SongRepository } from './song.repo'
import { EntityExistsValidator } from 'src/shared/validators/entity-exists.validator'

@Module({
  controllers: [SongController],
  providers: [SongService, SongRepository, EntityExistsValidator],
  exports: [SongService],
})
export class SongModule {}
