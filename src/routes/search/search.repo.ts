import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class SearchRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findSongs(conditions: Prisma.SongWhereInput, skip: number, limit: number, userId?: number) {
    return this.prismaService.song.findMany({
      where: conditions,
      skip,
      take: limit,
      orderBy: [{ playCount: 'desc' }, { uploadDate: 'desc' }],
      include: {
        contributors: {
          include: {
            label: {
              select: {
                id: true,
                labelName: true,
                imageUrl: true,
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
    return this.prismaService.song.count({ where: conditions })
  }

  async findAlbums(conditions: Prisma.AlbumWhereInput, skip: number, limit: number) {
    return this.prismaService.album.findMany({
      where: conditions,
      skip,
      take: limit,
      orderBy: { releaseDate: 'desc' },
      include: {
        label: {
          select: {
            id: true,
            labelName: true,
          },
        },
        _count: {
          select: { songs: true },
        },
      },
    })
  }

  async countAlbums(conditions: Prisma.AlbumWhereInput) {
    return this.prismaService.album.count({ where: conditions })
  }

  async findArtists(conditions: Prisma.RecordLabelWhereInput, skip: number, limit: number) {
    return this.prismaService.recordLabel.findMany({
      where: conditions,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { songs: true },
        },
      },
    })
  }

  async countArtists(conditions: Prisma.RecordLabelWhereInput) {
    return this.prismaService.recordLabel.count({ where: conditions })
  }

  async countFollowers(targetType: 'Artist' | 'Label', targetId: number) {
    return this.prismaService.follow.count({
      where: {
        targetType,
        targetId,
      },
    })
  }

  async findPlaylists(conditions: Prisma.PlaylistWhereInput, skip: number, limit: number) {
    return this.prismaService.playlist.findMany({
      where: conditions,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: { playlistSongs: true },
        },
      },
    })
  }

  async countPlaylists(conditions: Prisma.PlaylistWhereInput) {
    return this.prismaService.playlist.count({ where: conditions })
  }

  async findUsers(conditions: Prisma.UserWhereInput, skip: number, limit: number) {
    return this.prismaService.user.findMany({
      where: conditions,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        _count: {
          select: { playlists: true },
        },
      },
    })
  }

  async countUsers(conditions: Prisma.UserWhereInput) {
    return this.prismaService.user.count({ where: conditions })
  }

  async findSongSuggestions(query: string, limit: number) {
    return this.prismaService.song.findMany({
      where: {
        isActive: true,
        title: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      orderBy: { playCount: 'desc' },
      select: {
        id: true,
        title: true,
      },
    })
  }

  async findArtistSuggestions(query: string, limit: number) {
    return this.prismaService.recordLabel.findMany({
      where: {
        hasPublicProfile: true,
        labelName: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      select: {
        id: true,
        labelName: true,
      },
    })
  }

  async findAlbumSuggestions(query: string, limit: number) {
    return this.prismaService.album.findMany({
      where: {
        albumTitle: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      orderBy: { releaseDate: 'desc' },
      select: {
        id: true,
        albumTitle: true,
      },
    })
  }

  async findTrendingSongs(limit: number) {
    return this.prismaService.song.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { playCount: 'desc' },
      select: {
        id: true,
        title: true,
        contributors: {
          include: {
            label: {
              select: {
                labelName: true,
              },
            },
          },
        },
      },
    })
  }
}
