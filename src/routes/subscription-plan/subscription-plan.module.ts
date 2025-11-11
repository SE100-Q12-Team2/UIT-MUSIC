import { Module } from '@nestjs/common'
import { SubscriptionPlanController } from './subscription-plan.controller'
import { SubscriptionPlanService } from './subscription-plan.service'
import { SubscriptionPlanRepository } from './subscription-plan.repo'

@Module({
  controllers: [SubscriptionPlanController],
  providers: [SubscriptionPlanService, SubscriptionPlanRepository],
  exports: [SubscriptionPlanService],
})
export class SubscriptionPlanModule {}
