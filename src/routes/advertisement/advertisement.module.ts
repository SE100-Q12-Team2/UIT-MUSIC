import { Module } from '@nestjs/common'
import { AdvertisementController } from './advertisement.controller'
import { AdvertisementService } from './advertisement.service'
import { AdvertisementRepository } from './advertisement.repo'
import { PrismaService } from 'src/shared/services/prisma.service'

@Module({
  controllers: [AdvertisementController],
  providers: [AdvertisementService, AdvertisementRepository, PrismaService],
  exports: [AdvertisementService, AdvertisementRepository],
})
export class AdvertisementModule {}
