import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common'
import { RecommendationService } from './recommendation.service'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('personalized')
  @Auth([AuthType.Bearer])
  async getPersonalizedRecommendations(@ActiveUser('userId') userId: number, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20
    return this.recommendationService.getPersonalizedRecommendations(userId, limitNum) as any
  }

  @Get('similar/:songId')
  @Auth([AuthType.Bearer, AuthType.None])
  async getSimilarSongs(@Param('songId', ParseIntPipe) songId: number, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10
    return this.recommendationService.getSimilarSongs(songId, limitNum) as any
  }

  @Get('for-you')
  @Auth([AuthType.Bearer])
  async getDiscoverWeekly(@ActiveUser('userId') userId: number) {
    return this.recommendationService.getPersonalizedRecommendations(userId, 50) as any
  }

  @Get('daily-mix')
  @Auth([AuthType.Bearer])
  async getDailyMix(@ActiveUser('userId') userId: number) {
    const [favorites, trending, discover] = await Promise.all([
      this.recommendationService.getPersonalizedRecommendations(userId, 30),
      this.recommendationService.getPersonalizedRecommendations(userId, 30),
      this.recommendationService.getPersonalizedRecommendations(userId, 30),
    ])

    return {
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
    } as any
  }
}
