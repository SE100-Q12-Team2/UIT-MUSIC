import { Module } from '@nestjs/common'
import { RecommendationController } from './recommendation.controller'
import { RecommendationService } from './recommendation.service'
import { RecommendationRepository } from './recommendation.repo'
import { PrismaService } from 'src/shared/services/prisma.service'
import { SongModule } from '../song/song.module'

@Module({
  imports: [SongModule],
  controllers: [RecommendationController],
  providers: [RecommendationService, RecommendationRepository, PrismaService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
