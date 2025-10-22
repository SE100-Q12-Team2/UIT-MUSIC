import { Module } from '@nestjs/common';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { GenreRepository } from './genre.repo';
import { PrismaService } from 'src/shared/services';

@Module({
  controllers: [GenreController],
  providers: [GenreService, GenreRepository, PrismaService],
  exports: [GenreService],
})
export class GenreModule {}
