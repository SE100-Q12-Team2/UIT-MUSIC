import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class AlbumRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAlbums(
    conditions: Prisma.AlbumWhereInput,
    skip: number,
    limit: number,
    orderBy: Prisma.AlbumOrderByWithRelationInput[],
  ) {
    return this.prisma.album.findMany({
      where: conditions,
      skip,
      take: limit,
      orderBy,
      include: {
        label: {
          select: {
            id: true,
            labelName: true,
            hasPublicProfile: true,
          },
        },
        _count: {
          select: { songs: true },
        },
      },
    })
  }

  async countAlbums(conditions: Prisma.AlbumWhereInput) {
    return this.prisma.album.count({ where: conditions })
  }

  async findAlbumById(albumId: number, includeSongs = false) {
    return this.prisma.album.findUnique({
      where: { id: albumId },
      include: {
        label: {
          select: {
            id: true,
            labelName: true,
            hasPublicProfile: true,
          },
        },
        ...(includeSongs && {
          songs: {
            where: { isActive: true },
            orderBy: { uploadDate: 'asc' },
            include: {
              songArtists: {
                include: {
                  artist: {
                    select: {
                      id: true,
                      artistName: true,
                      profileImage: true,
                    },
                  },
                },
              },
            },
          },
        }),
        _count: {
          select: { songs: true },
        },
      },
    })
  }

  async createAlbum(data: Prisma.AlbumCreateInput) {
    return this.prisma.album.create({
      data,
      include: {
        label: {
          select: {
            id: true,
            labelName: true,
            hasPublicProfile: true,
          },
        },
      },
    })
  }

  async updateAlbum(albumId: number, data: Prisma.AlbumUpdateInput) {
    return this.prisma.album.update({
      where: { id: albumId },
      data,
      include: {
        label: {
          select: {
            id: true,
            labelName: true,
            hasPublicProfile: true,
          },
        },
      },
    })
  }

  async deleteAlbum(albumId: number) {
    return this.prisma.album.delete({
      where: { id: albumId },
    })
  }

  async detachSongsFromAlbum(albumId: number) {
    return this.prisma.song.updateMany({
      where: { albumId },
      data: { albumId: null },
    })
  }

  async checkAlbumExists(albumId: number) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true },
    })
    return !!album
  }

  async getAlbumsByLabel(labelId: number) {
    return this.prisma.album.findMany({
      where: { labelId },
      select: { id: true, albumTitle: true, coverImage: true, releaseDate: true },
      orderBy: { releaseDate: 'desc' },
    })
  }

  async getLabelIdByUserId(userId: number) {
    const label = await this.prisma.recordLabel.findUnique({
      where: { userId },
      select: { id: true },
    })
    return label ? Number(label.id) : null
  }

  async updateAlbumTotalTracks(albumId: number) {
    const count = await this.prisma.song.count({
      where: { albumId, isActive: true },
    })

    return this.prisma.album.update({
      where: { id: albumId },
      data: { totalTracks: count },
    })
  }
}
