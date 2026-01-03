import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class SongRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSongs(
    conditions: Prisma.SongWhereInput,
    skip: number,
    limit: number,
    orderBy: Prisma.SongOrderByWithRelationInput[],
    userId?: number,
  ) {
    return this.prisma.song.findMany({
      where: conditions,
      skip,
      take: limit,
      orderBy,
      include: {
        contributors: {
          include: {
            label: {
              select: {
                id: true,
                labelName: true,
              },
            },
          },
        },
        album: {
          select: {
            id: true,
            albumTitle: true,
            coverImage: true,
          },
        },
        genre: {
          select: {
            id: true,
            genreName: true,
          },
        },
        label: {
          select: {
            id: true,
            labelName: true,
          },
        },
        asset: {
          select: {
            id: true,
            bucket: true,
            keyMaster: true,
          },
        },
        ...(userId && {
          favorites: {
            where: { userId },
            select: { userId: true },
          },
        }),
      },
    })
  }

  async countSongs(conditions: Prisma.SongWhereInput) {
    return this.prisma.song.count({ where: conditions })
  }

  async findSongById(songId: number, userId?: number) {
    return this.prisma.song.findUnique({
      where: { id: songId },
      include: {
        contributors: {
          include: {
            label: {
              select: {
                id: true,
                labelName: true,
              },
            },
          },
        },
        album: {
          select: {
            id: true,
            albumTitle: true,
            coverImage: true,
            releaseDate: true,
          },
        },
        genre: {
          select: {
            id: true,
            genreName: true,
          },
        },
        label: {
          select: {
            id: true,
            labelName: true,
          },
        },
        asset: {
          select: {
            id: true,
            bucket: true,
            keyMaster: true,
          },
        },
        ...(userId && {
          favorites: {
            where: { userId },
            select: { userId: true },
          },
        }),
      },
    })
  }

  async createSong(data: Prisma.SongCreateInput) {
    return this.prisma.song.create({
      data,
      include: {
        contributors: {
          include: {
            label: {
              select: {
                id: true,
                labelName: true,
              },
            },
          },
        },
      },
    })
  }

  async updateSong(songId: number, data: Prisma.SongUpdateInput) {
    return this.prisma.song.update({
      where: { id: songId },
      data,
    })
  }

  async deleteSong(songId: number) {
    return this.prisma.song.delete({
      where: { id: songId },
    })
  }

  async incrementPlayCount(songId: number) {
    return this.prisma.song.update({
      where: { id: songId },
      data: {
        playCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        playCount: true,
      },
    })
  }

  async createSongContributorsFromAssignments(songId: number, contributors: Array<{ labelId: number; role: string }>) {
    const songContributors = contributors.map((contributor) => ({
      songId,
      labelId: contributor.labelId,
      role: contributor.role as any,
    }))

    return this.prisma.songContributor.createMany({
      data: songContributors,
    })
  }

  async deleteSongContributors(songId: number) {
    return this.prisma.songContributor.deleteMany({
      where: { songId },
    })
  }

  async findTrendingSongs(limit: number, genreId?: number, userId?: number) {
    const conditions: Prisma.SongWhereInput = {
      isActive: true,
      ...(genreId && { genreId }),
    }

    return this.prisma.song.findMany({
      where: conditions,
      take: limit,
      orderBy: { playCount: 'desc' },
      include: {
        contributors: {
          include: {
            label: {
              select: {
                id: true,
                labelName: true,
              },
            },
          },
        },
        album: {
          select: {
            id: true,
            albumTitle: true,
            coverImage: true,
          },
        },
        genre: {
          select: {
            id: true,
            genreName: true,
          },
        },
        label: {
          select: {
            id: true,
            labelName: true,
          },
        },
        asset: {
          select: {
            id: true,
            bucket: true,
            keyMaster: true,
          },
        },
        ...(userId && {
          favorites: {
            where: { userId },
            select: { userId: true },
          },
        }),
      },
    })
  }

  async checkSongExists(songId: number) {
    const song = await this.prisma.song.findUnique({
      where: { id: songId },
      select: { id: true },
    })
    return !!song
  }

  async getSongsByLabel(labelId: number) {
    return this.prisma.song.findMany({
      where: { labelId },
      select: { id: true },
    })
  }

  async getLabelIdByUserId(userId: number) {
    const label = await this.prisma.recordLabel.findUnique({
      where: { userId },
      select: { id: true },
    })
    return label ? Number(label.id) : null
  }

  async countTracksByAlbumIds(albumIds: number[]) {
    if (albumIds.length === 0) return []

    return this.prisma.song.groupBy({
      by: ['albumId'],
      where: {
        albumId: { in: albumIds },
      },
      _count: {
        id: true,
      },
    })
  }
}
