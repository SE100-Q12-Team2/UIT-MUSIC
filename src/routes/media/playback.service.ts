import { Injectable, Param, Query } from '@nestjs/common'
import env from 'src/shared/config'
import { createSign } from 'crypto'
import { GetPlaybackQuery, GetPlaybackQueryType } from 'src/routes/media/media.model'
import { PrismaService } from 'src/shared/services'
import { toPublicUrlFromRendition } from 'src/shared/lib'

type SignUrlParams = { url: string; expiresInSec: number }

@Injectable()
export class PlaybackService {
  constructor(private prisma: PrismaService) {}

  async getPlayBackUrl(@Param('songId') songIdStr: string, @Query() raw: any) {
    const songId = Number(songIdStr)
    const { quality }: GetPlaybackQueryType = GetPlaybackQuery.parse(raw)

    const song = await this.prisma.song.findUnique({
      where: { id: songId },
      include: { asset: { include: { renditions: true } } },
    })
    if (!song || !song.asset) return { ok: false, reason: 'not_found' }

    const rs = song.asset.renditions
    let r: (typeof rs)[number] | undefined

    if (quality === '320') r = rs.find((x) => x.type === 'MP3' && x.quality === '320kbps')
    if (!r && quality === '128') r = rs.find((x) => x.type === 'MP3' && x.quality === '128kbps')
    if (!r && quality === 'hls') r = rs.find((x) => x.type === 'HLS')
    if (!r) {
      r =
        rs.find((x) => x.type === 'HLS') ??
        rs.find((x) => x.type === 'MP3' && x.quality === '320kbps') ??
        rs.find((x) => x.type === 'MP3' && x.quality === '128kbps') ??
        undefined
    }

    if (!r) return { ok: false, reason: 'no_rendition' }

    const url = toPublicUrlFromRendition(r)
    const finalUrl = env.CF_DOMAIN ? this.signUrl({ url, expiresInSec: 1800 }) : url

    return { ok: true, url: finalUrl, type: r.type, mime: r.mime, quality: r.quality }
  }

  // ký URL CloudFront dạng canned policy
  signUrl({ url, expiresInSec }: SignUrlParams) {
    const expires = Math.floor(Date.now() / 1000) + expiresInSec
    const policy = `{"Statement":[{"Resource":"${url}","Condition":{"DateLessThan":{"AWS:EpochTime":${expires}}}}]}`
    const signer = createSign('RSA-SHA1')
    signer.update(policy)
    const signature = signer
      .sign(env.CF_PRIVATE_KEY)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/=/g, '_')
      .replace(/\//g, '~')

    const kp = env.CF_KEY_PAIR_ID
    const signed = `${url}${url.includes('?') ? '&' : '?'}Expires=${expires}&Signature=${signature}&Key-Pair-Id=${kp}`
    return signed
  }
}
