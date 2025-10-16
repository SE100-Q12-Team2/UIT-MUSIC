// src/modules/media/playback.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common'
import { GetPlaybackQuery, GetPlaybackQueryType } from 'src/routes/media/media.model'
import { PlaybackService } from './playback.service'
import env from 'src/shared/config'
import { PrismaService } from 'src/shared/services'

@Controller('playback')
export class PlaybackController {
  constructor(
    private prisma: PrismaService,
    private playback: PlaybackService,
  ) {}

  @Get('track/:songId')
  async getPlayback(@Param('songId') songIdStr: string, @Query() raw: any) {
    const songId = Number(songIdStr)
    const { quality }: GetPlaybackQueryType = GetPlaybackQuery.parse(raw)

    const song = await this.prisma.song.findUnique({
      where: { id: songId },
      include: { asset: { include: { renditions: true } } },
    })
    if (!song || !song.asset) return { ok: false, reason: 'not_found' }

    const rs = song.asset.renditions

    let r: (typeof rs)[number] | undefined

    if (quality === '320') r = rs.find((x) => x.type === 'MP3' && x.quality === 'Q320kbps')
    if (!r && quality === '128') r = rs.find((x) => x.type === 'MP3' && x.quality === 'Q128kbps')
    if (!r && quality === 'hls') r = rs.find((x) => x.type === 'HLS')
    if (!r) {
      r =
        rs.find((x) => x.type === 'HLS') ??
        rs.find((x) => x.type === 'MP3' && x.quality === 'Q320kbps') ??
        rs.find((x) => x.type === 'MP3' && x.quality === 'Q128kbps')
    }

    if (!r) return { ok: false, reason: 'no_rendition' }

    const cfBase = /^https?:\/\//i.test(env.CF_DOMAIN) ? env.CF_DOMAIN : `https://${env.CF_DOMAIN}`
    const url = `${cfBase}/${r.key}`
    const signed = this.playback.signUrl({ url, expiresInSec: 1800 })

    return { ok: true, url: signed, type: r.type, mime: r.mime, quality: r.quality }
  }
}
