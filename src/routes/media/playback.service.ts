import { Injectable, Param, Query } from '@nestjs/common'
import env from 'src/shared/config'
import { createSign } from 'crypto'
import { GetPlaybackQuery, GetPlaybackQueryType } from 'src/routes/media/media.model'
import { PrismaService } from 'src/shared/services'
import { toPublicUrlFromRendition } from 'src/shared/lib'
import { AudioQuality, RenditionType } from '@prisma/client'

type SignUrlParams = { url: string; expiresInSec: number }

type Rendition = {
  type: RenditionType
  quality: AudioQuality | null
  mime: string
  bucket: string
  key: string
}
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

    if (!song || !song.asset) {
      return { ok: false, reason: 'not_found' }
    }

    const rs = song.asset.renditions as Rendition[]

    const rendition = this.pickRendition(rs, quality)

    if (!rendition) {
      return { ok: false, reason: 'no_rendition' }
    }

    const url = toPublicUrlFromRendition(rendition)
    const finalUrl = env.CF_DOMAIN
      ? this.signUrl({ url, expiresInSec: 1800 })
      : url

    return {
      ok: true,
      url: finalUrl,
      type: rendition.type,
      mime: rendition.mime,
      quality: rendition.quality ?? null,
    }
  }

  /**
   * Chọn rendition theo policy
   */
  private pickRendition(
  rs: Rendition[],
  quality: 'hls' | '320' | '128',
): Rendition | undefined {
  const POLICY: Record<
    typeof quality,
    { type: Rendition['type']; quality?: AudioQuality }[]
  > = {
    hls: [
      { type: 'HLS' },
    ],
    '320': [
      { type: 'MP3', quality: 'Q320kbps' },
      { type: 'HLS' },
    ],
    '128': [
      { type: 'MP3', quality: 'Q128kbps' },
      { type: 'HLS' },
    ],
  }

  for (const rule of POLICY[quality]) {
    const r = rs.find(
      (x) =>
        x.type === rule.type &&
        (rule.quality == null || x.quality === rule.quality),
    )
    if (r) return r
  }

  return undefined
}


  // ký URL CloudFront dạng canned policy
  private signUrl({ url, expiresInSec }: SignUrlParams) {
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

    return `${url}${url.includes('?') ? '&' : '?'}Expires=${expires}&Signature=${signature}&Key-Pair-Id=${env.CF_KEY_PAIR_ID}`
  }
}
