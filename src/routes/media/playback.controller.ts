import { Controller, Get, Param, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiOkResponse } from '@nestjs/swagger'
import { PlaybackService } from './playback.service'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('Media Playback')
@Controller('playback')
@Auth([AuthType.None])
export class PlaybackController {
  private readonly logger = new Logger(PlaybackController.name)

  constructor(private playbackService: PlaybackService) {}

  @Get('track/:songId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get playback URL', description: 'Get streaming URL for a song. Public access.' })
  @ApiParam({ name: 'songId', type: String, description: 'Song ID' })
  @ApiQuery({ name: 'quality', required: false, description: 'Audio quality preference' })
  @ApiOkResponse({ description: 'Playback URL retrieved' })
  async getPlayback(@Param('songId') songIdStr: string, @Query() raw: any) {
    try {
      this.logger.log(`Get playback URL for song ${songIdStr}`)
      return await this.playbackService.getPlayBackUrl(songIdStr, raw)
    } catch (error) {
      this.logger.error(`Failed to get playback URL for song ${songIdStr}`, error.stack)
      throw error
    }
  }
}
