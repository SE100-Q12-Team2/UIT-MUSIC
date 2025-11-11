import { Module } from '@nestjs/common'
import { UserSubscriptionController } from './user-subscription.controller'
import { UserSubscriptionService } from './user-subscription.service'
import { UserSubscriptionRepository } from './user-subscription.repo'

@Module({
  controllers: [UserSubscriptionController],
  providers: [UserSubscriptionService, UserSubscriptionRepository],
  exports: [UserSubscriptionService],
})
export class UserSubscriptionModule {}
