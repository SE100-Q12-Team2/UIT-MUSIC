import { Module } from '@nestjs/common'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { StatisticsRepository } from './statistics.repo'
import { PrismaService } from 'src/shared/services/prisma.service'

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService, StatisticsRepository, PrismaService],
  exports: [StatisticsService, StatisticsRepository],
})
export class StatisticsModule {}
