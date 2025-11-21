import { Controller, Get, Param, Query } from '@nestjs/common'
import { PlaybackService } from './playback.service'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@Controller('playback')
@Auth([AuthType.None])
export class PlaybackController {
  constructor(private playbackService: PlaybackService) {}

  @Get('track/:songId')
  async getPlayback(@Param('songId') songIdStr: string, @Query() raw: any) {
    return await this.playbackService.getPlayBackUrl(songIdStr, raw)
  }
}
