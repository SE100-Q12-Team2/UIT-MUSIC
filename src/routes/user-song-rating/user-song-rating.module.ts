import { Module } from '@nestjs/common'
import { UserSongRatingController } from './user-song-rating.controller'
import { UserSongRatingService } from './user-song-rating.service'
import { UserSongRatingRepository } from './user-song-rating.repo'

@Module({
  controllers: [UserSongRatingController],
  providers: [UserSongRatingService, UserSongRatingRepository],
  exports: [UserSongRatingService, UserSongRatingRepository],
})
export class UserSongRatingModule {}
