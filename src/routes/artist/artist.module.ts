import { Module } from '@nestjs/common'
import { ArtistController } from 'src/routes/artist/artist.controller'
import { ArtistRepository } from 'src/routes/artist/artist.repo'
import { ArtistService } from 'src/routes/artist/artist.service'
import { PrismaService } from 'src/shared/services'

@Module({
  controllers: [ArtistController],
  providers: [ArtistService, ArtistRepository, PrismaService],
  exports: [ArtistService],
})
export class ArtistModule {}
