import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { UserSongRatingService } from './user-song-rating.service'
import {
  CreateRatingDto,
  UpdateRatingDto,
  QueryUserRatingsDto,
  RatingResponseDto,
  SongRatingStatsDto,
  UserRatingStatsDto,
} from './user-song-rating.dto'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('ratings')
export class UserSongRatingController {
  constructor(private readonly ratingService: UserSongRatingService) {}

  @Post('songs/:songId')
  async createOrUpdateRating(
    @ActiveUser('userId') userId: number,
    @Param('songId', ParseIntPipe) songId: number,
    @Body() data: CreateRatingDto,
  ): Promise<RatingResponseDto> {
    data.songId = songId
    return this.ratingService.createOrUpdateRating(userId, data)
  }

  @Post('songs/:songId/update')
  async updateRating(
    @ActiveUser('userId') userId: number,
    @Param('songId', ParseIntPipe) songId: number,
    @Body() data: UpdateRatingDto,
  ): Promise<RatingResponseDto> {
    return this.ratingService.updateRating(userId, songId, data)
  }

  @Delete('songs/:songId')
  async deleteRating(@ActiveUser('userId') userId: number, @Param('songId', ParseIntPipe) songId: number) {
    return this.ratingService.deleteRating(userId, songId)
  }

  @Get('songs/:songId/me')
  async getUserRating(
    @ActiveUser('userId') userId: number,
    @Param('songId', ParseIntPipe) songId: number,
  ): Promise<RatingResponseDto | null> {
    return this.ratingService.getUserRating(userId, songId)
  }

  @Get('me')
  async getUserRatings(@ActiveUser('userId') userId: number, @Query() query: QueryUserRatingsDto) {
    return this.ratingService.getUserRatings(userId, query)
  }

  @Get('me/liked-songs')
  async getLikedSongs(
    @ActiveUser('userId') userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return this.ratingService.getLikedSongs(userId, page, limit)
  }

  @Get('songs/:songId/stats')
  @IsPublic()
  async getSongRatingStats(
    @Param('songId', ParseIntPipe) songId: number,
    @ActiveUser('userId') userId?: number
  ): Promise<SongRatingStatsDto> {
    return this.ratingService.getSongRatingStats(songId, userId)
  }

  @Get('me/stats')
  async getUserRatingStats(@ActiveUser('userId') userId: number): Promise<UserRatingStatsDto> {
    return this.ratingService.getUserRatingStats(userId)
  }
}
