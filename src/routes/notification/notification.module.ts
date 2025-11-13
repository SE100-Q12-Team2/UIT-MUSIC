import { Module } from '@nestjs/common'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'
import { NotificationRepository } from './notification.repo'
import { NotificationCron } from './notification.cron'
import { PrismaService } from 'src/shared/services/prisma.service'

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, NotificationCron, PrismaService],
  exports: [NotificationService, NotificationRepository],
})
export class NotificationModule {}
