import { Controller, Get, Query, Param, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger'
import { RecommendationService } from './recommendation.service'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name)

  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('personalized')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get personalized recommendations',
    description: 'Retrieve personalized song recommendations based on user listening history, preferences, and behavior. Uses collaborative filtering and content-based algorithms to suggest relevant songs.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recommendations (default: 20)' })
  @ApiOkResponse({ description: 'Personalized recommendations retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getPersonalizedRecommendations(@ActiveUser('userId') userId: number, @Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 20
      this.logger.log(`Get personalized recommendations for user ${userId}, limit: ${limitNum}`)
      const result = await this.recommendationService.getPersonalizedRecommendations(userId, limitNum)
      this.logger.log(`Retrieved ${limitNum} recommendations for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get personalized recommendations for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get('similar/:songId')
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get similar songs',
    description: 'Retrieve songs similar to a specific song based on audio features, genre, artist, and user preferences. Does not require authentication for public access.',
  })
  @ApiParam({ name: 'songId', type: Number, description: 'Song ID to find similar songs for' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of similar songs (default: 10)' })
  @ApiOkResponse({ description: 'Similar songs retrieved successfully' })
  async getSimilarSongs(@Param('songId', ParseIntPipe) songId: number, @Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 10
      this.logger.log(`Get similar songs for song ${songId}, limit: ${limitNum}`)
      const result = await this.recommendationService.getSimilarSongs(songId, limitNum)
      this.logger.log(`Retrieved ${limitNum} similar songs for song ${songId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get similar songs for song ${songId}`, error.stack)
      throw error
    }
  }

  @Get('for-you')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get discover weekly',
    description: 'Retrieve a curated weekly discovery playlist with 50 fresh song recommendations tailored to user taste. Updated weekly based on listening patterns and preferences.',
  })
  @ApiOkResponse({ description: 'Discover weekly playlist retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getDiscoverWeekly(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Get discover weekly for user ${userId}`)
      const result = await this.recommendationService.getPersonalizedRecommendations(userId, 50)
      this.logger.log(`Retrieved discover weekly for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get discover weekly for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get('daily-mix')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get daily mixes',
    description: 'Retrieve multiple daily mix playlists personalized for the user. Includes favorite mix, trending mix, and discovery mix with 30 songs each, refreshed daily.',
  })
  @ApiOkResponse({ description: 'Daily mixes retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getDailyMix(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Get daily mixes for user ${userId}`)
      const [favorites, trending, discover] = await Promise.all([
        this.recommendationService.getPersonalizedRecommendations(userId, 30),
        this.recommendationService.getPersonalizedRecommendations(userId, 30),
        this.recommendationService.getPersonalizedRecommendations(userId, 30),
      ])

      const result = {
        mixes: [
          {
            id: 'daily-mix-1',
            title: 'Your Favorites Mix',
            description: 'Songs you love and more like them',
            songs: favorites,
          },
          {
            id: 'daily-mix-2',
            title: 'Trending Mix',
            description: 'Popular songs you might like',
            songs: trending,
          },
          {
            id: 'daily-mix-3',
            title: 'Discovery Mix',
            description: 'New songs to explore',
            songs: discover,
          },
        ],
      }
      this.logger.log(`Retrieved daily mixes for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get daily mixes for user ${userId}`, error.stack)
      throw error
    }
  }
}
