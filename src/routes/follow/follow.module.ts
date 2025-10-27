import { Module } from '@nestjs/common'
import { FollowController } from 'src/routes/follow/follow.controller'
import { FollowRepository } from 'src/routes/follow/follow.repo'
import { FollowService } from 'src/routes/follow/follow.service'

@Module({
  providers: [FollowService, FollowRepository],
  controllers: [FollowController],
  exports: [FollowService, FollowRepository],
})
export class FollowModule {}
