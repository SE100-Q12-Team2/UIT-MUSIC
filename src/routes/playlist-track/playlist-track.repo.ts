import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { GetPlaylistTracksResType, ListPlaylistTracksQuery } from 'src/routes/playlist-track/playlist-track.model'
import { PrismaService } from 'src/shared/services'

const STEP = 1000

@Injectable()
export class PlaylistTracksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensurePlaylist(playlistId: number) {
    const p = await this.prisma.playlist.findUnique({ where: { id: playlistId } })
    if (!p) throw new NotFoundException('Playlist not found')
    return p
  }

  async findRow(playlistId: number, songId: number) {
    return this.prisma.playlistSong.findUnique({
      where: { playlistId_songId: { playlistId, songId } },
    })
  }

  async list(playlistId: number, q: ListPlaylistTracksQuery): Promise<GetPlaylistTracksResType> {
    const where: Prisma.PlaylistSongWhereInput = { playlistId }

    // addedAt range
    if (q.addedFrom || q.addedTo) {
      where.addedAt = {
        ...(q.addedFrom ? { gte: q.addedFrom } : {}),
        ...(q.addedTo ? { lte: q.addedTo } : {}),
      }
    }

    // ---- Build SongWhereInput riêng, rồi gán vào where.song ----
    const songWhere: Prisma.SongWhereInput = {}

    // duration
    if (q.minDuration || q.maxDuration) {
      songWhere.duration = {
        ...(q.minDuration ? { gte: q.minDuration } : {}),
        ...(q.maxDuration ? { lte: q.maxDuration } : {}),
      }
    }

    // title
    if (q.songTitle) {
      songWhere.title = { contains: q.songTitle, mode: Prisma.QueryMode.insensitive }
    }

    // album
    if (q.albumId) {
      songWhere.albumId = q.albumId
    }
    if (q.albumTitle) {
      songWhere.album = { albumTitle: { contains: q.albumTitle, mode: Prisma.QueryMode.insensitive } }
    }

    // record label (qua SongContributor)
    if (q.artistId || q.artistName) {
      const contributorCond: Prisma.SongContributorWhereInput = {}
      if (q.artistId) {
        contributorCond.labelId = q.artistId
      }
      if (q.artistName) {
        contributorCond.label = {
          is: {
            labelName: { contains: q.artistName, mode: Prisma.QueryMode.insensitive },
          },
        }
      }
      songWhere.contributors = { some: contributorCond }
    }

    // Chỉ gán nếu có điều kiện trên song
    if (Object.keys(songWhere).length > 0) {
      where.song = songWhere
    }

    // ORDER BY
    const orderBy: Prisma.PlaylistSongOrderByWithRelationInput[] = [{ [q.sort]: q.order }]

    // QUERY song song
    const [data, total] = await this.prisma.$transaction([
      this.prisma.playlistSong.findMany({
        where,
        orderBy,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        include: {
          song: {
            select: {
              id: true,
              title: true,
              duration: true,
              album: { select: { id: true, albumTitle: true, coverImage: true } },
              contributors: { select: { label: { select: { id: true, labelName: true } } } },
              asset: { select: { id: true, bucket: true, keyMaster: true } },
            },
          },
        },
      }),
      this.prisma.playlistSong.count({ where }),
    ])

    return {
      data: data.map((item) => ({
        ...item,
        addedAt: item.addedAt.toISOString(),
      })),
      page: q.page,
      totalPages: Math.ceil(total / q.limit),
      totalItems: total,
      limit: q.limit,
    }
  }

  async minPosition(playlistId: number) {
    const row = await this.prisma.playlistSong.findFirst({
      where: { playlistId },
      orderBy: { position: 'asc' },
      select: { position: true },
    })
    return row?.position ?? null
  }

  async maxPosition(playlistId: number) {
    const row = await this.prisma.playlistSong.findFirst({
      where: { playlistId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    return row?.position ?? null
  }

  async neighborByBefore(playlistId: number, beforeTrackId: number) {
    const before = await this.findRow(playlistId, beforeTrackId)
    if (!before) throw new NotFoundException('beforeTrackId không tồn tại trong playlist')
    const left = await this.prisma.playlistSong.findFirst({
      where: { playlistId, position: { lt: before.position } },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    return { left: left?.position ?? null, right: before.position }
  }

  async neighborByAfter(playlistId: number, afterTrackId: number) {
    const after = await this.findRow(playlistId, afterTrackId)
    if (!after) throw new NotFoundException('afterTrackId không tồn tại trong playlist')
    const right = await this.prisma.playlistSong.findFirst({
      where: { playlistId, position: { gt: after.position } },
      orderBy: { position: 'asc' },
      select: { position: true },
    })
    return { left: after.position, right: right?.position ?? null }
  }

  async create(playlistId: number, songId: number, position: number) {
    return this.prisma.playlistSong.create({
      data: { playlistId, songId, position },
    })
  }

  async updatePosition(playlistId: number, songId: number, position: number) {
    return this.prisma.playlistSong.update({
      where: { playlistId_songId: { playlistId, songId } },
      data: { position },
    })
  }

  async delete(playlistId: number, songId: number) {
    await this.prisma.playlistSong.delete({
      where: { playlistId_songId: { playlistId, songId } },
    })
  }

  /** Renormalize: 1000, 2000, 3000, ... */
  async renormalize(playlistId: number) {
    const rows = await this.prisma.playlistSong.findMany({
      where: { playlistId },
      orderBy: { position: 'asc' },
      select: { songId: true },
    })

    const ops = rows.map((r, i) =>
      this.prisma.playlistSong.update({
        where: { playlistId_songId: { playlistId, songId: r.songId } },
        data: { position: (i + 1) * STEP },
      }),
    )
    if (ops.length) await this.prisma.$transaction(ops)
  }
}
