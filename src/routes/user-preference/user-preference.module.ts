import { Module } from '@nestjs/common'
import { UserPreferenceController } from './user-preference.controller'
import { UserPreferenceService } from './user-preference.service'
import { UserPreferenceRepository } from './user-preference.repo'

@Module({
  controllers: [UserPreferenceController],
  providers: [UserPreferenceService, UserPreferenceRepository],
  exports: [UserPreferenceService, UserPreferenceRepository],
})
export class UserPreferenceModule {}
