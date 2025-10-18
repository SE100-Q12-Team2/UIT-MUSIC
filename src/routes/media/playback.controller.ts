import { Controller, Get, Param, Query } from '@nestjs/common'
import { PlaybackService } from './playback.service'

@Controller('playback')
export class PlaybackController {
  constructor(private playbackService: PlaybackService) {}

  @Get('track/:songId')
  async getPlayback(@Param('songId') songIdStr: string, @Query() raw: any) {
    return await this.playbackService.getPlayBackUrl(songIdStr, raw)
  }
}
