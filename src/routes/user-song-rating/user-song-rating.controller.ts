import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger'
import { UserSongRatingService } from './user-song-rating.service'
import {
  CreateRatingDto,
  UpdateRatingDto,
  QueryUserRatingsDto,
  RatingResponseDto,
  SongRatingStatsDto,
  UserRatingStatsDto,
} from './user-song-rating.dto'
import { IsPublic, Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@ApiTags('Song Ratings')
@Controller('ratings')
@Auth([AuthType.Bearer])
export class UserSongRatingController {
  private readonly logger = new Logger(UserSongRatingController.name)

  constructor(private readonly ratingService: UserSongRatingService) {}

  @Post('songs/:songId')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Rate a song', description: 'Create or update rating for a song. Requires authentication.' })
  @ApiParam({ name: 'songId', type: Number })
  @ApiBody({ type: CreateRatingDto })
  @ApiCreatedResponse({ description: 'Rating created/updated', type: RatingResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createOrUpdateRating(
    @ActiveUser('userId') userId: number,
    @Param('songId', ParseIntPipe) songId: number,
    @Body() data: CreateRatingDto,
  ): Promise<RatingResponseDto> {
    try {
      this.logger.log(`User ${userId} rating song ${songId}`)
      data.songId = songId
      return await this.ratingService.createOrUpdateRating(userId, data)
    } catch (error) {
      this.logger.error(`Failed to rate song ${songId}`, error.stack)
      throw error
    }
  }

  @Post('songs/:songId/update')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update rating', description: 'Update existing song rating. Requires authentication.' })
  @ApiParam({ name: 'songId', type: Number })
  @ApiBody({ type: UpdateRatingDto })
  @ApiOkResponse({ description: 'Rating updated', type: RatingResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Rating not found' })
  async updateRating(
    @ActiveUser('userId') userId: number,
    @Param('songId', ParseIntPipe) songId: number,
    @Body() data: UpdateRatingDto,
  ): Promise<RatingResponseDto> {
    try {
      this.logger.log(`User ${userId} updating rating for song ${songId}`)
      return await this.ratingService.updateRating(userId, songId, data)
    } catch (error) {
      this.logger.error(`Failed to update rating for song ${songId}`, error.stack)
      throw error
    }
  }

  @Delete('songs/:songId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete rating', description: 'Remove rating from a song. Requires authentication.' })
  @ApiParam({ name: 'songId', type: Number })
  @ApiOkResponse({ description: 'Rating deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Rating not found' })
  async deleteRating(@ActiveUser('userId') userId: number, @Param('songId', ParseIntPipe) songId: number) {
    try {
      this.logger.log(`User ${userId} deleting rating for song ${songId}`)
      return await this.ratingService.deleteRating(userId, songId)
    } catch (error) {
      this.logger.error(`Failed to delete rating for song ${songId}`, error.stack)
      throw error
    }
  }

  @Get('songs/:songId/me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my rating', description: 'Get authenticated user\'s rating for a song. Requires authentication.' })
  @ApiParam({ name: 'songId', type: Number })
  @ApiOkResponse({ description: 'User rating retrieved', type: RatingResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getUserRating(
    @ActiveUser('userId') userId: number,
    @Param('songId', ParseIntPipe) songId: number,
  ): Promise<RatingResponseDto | null> {
    try {
      this.logger.log(`Get rating for user ${userId} song ${songId}`)
      return await this.ratingService.getUserRating(userId, songId)
    } catch (error) {
      this.logger.error(`Failed to get rating`, error.stack)
      throw error
    }
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my ratings', description: 'Get all ratings by authenticated user. Requires authentication.' })
  @ApiOkResponse({ description: 'User ratings retrieved' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getUserRatings(@ActiveUser('userId') userId: number, @Query() query: QueryUserRatingsDto) {
    try {
      this.logger.log(`Get all ratings for user ${userId}`)
      return await this.ratingService.getUserRatings(userId, query)
    } catch (error) {
      this.logger.error(`Failed to get user ratings`, error.stack)
      throw error
    }
  }

  @Get('me/liked-songs')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get liked songs', description: 'Get songs with positive ratings by user. Requires authentication.' })
  @ApiOkResponse({ description: 'Liked songs retrieved' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getLikedSongs(
    @ActiveUser('userId') userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    try {
      this.logger.log(`Get liked songs for user ${userId}`)
      return await this.ratingService.getLikedSongs(userId, page, limit)
    } catch (error) {
      this.logger.error(`Failed to get liked songs`, error.stack)
      throw error
    }
  }

  @Get('songs/:songId/stats')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get song rating stats', description: 'Get rating statistics for a song. Public access.' })
  @ApiParam({ name: 'songId', type: Number })
  @ApiOkResponse({ description: 'Song statistics retrieved', type: SongRatingStatsDto })
  async getSongRatingStats(
    @Param('songId', ParseIntPipe) songId: number,
    @ActiveUser('userId') userId?: number,
  ): Promise<SongRatingStatsDto> {
    try {
      this.logger.log(`Get rating stats for song ${songId}`)
      return await this.ratingService.getSongRatingStats(songId, userId)
    } catch (error) {
      this.logger.error(`Failed to get song stats`, error.stack)
      throw error
    }
  }

  @Get('me/stats')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my rating stats', description: 'Get rating statistics for authenticated user. Requires authentication.' })
  @ApiOkResponse({ description: 'User statistics retrieved', type: UserRatingStatsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getUserRatingStats(@ActiveUser('userId') userId: number): Promise<UserRatingStatsDto> {
    try {
      this.logger.log(`Get rating stats for user ${userId}`)
      return await this.ratingService.getUserRatingStats(userId)
    } catch (error) {
      this.logger.error(`Failed to get user stats`, error.stack)
      throw error
    }
  }
}
