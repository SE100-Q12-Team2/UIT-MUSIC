import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AlbumRepository } from './album.repo'
import { Prisma } from '@prisma/client'
import { GetAlbumsQueryType, CreateAlbumType, UpdateAlbumType } from './album.model'
import { AlbumOrder } from 'src/shared/constants/album.constant'
import { SEARCH_SYNC_EVENTS } from 'src/shared/events/search-sync.events'

@Injectable()
export class AlbumService {
  constructor(
    private readonly albumRepo: AlbumRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAlbums(query: GetAlbumsQueryType) {
    const { page, limit, labelId, order, search } = query
    const skip = (page - 1) * limit

    const conditions: Prisma.AlbumWhereInput = {
      ...(labelId && { labelId }),
      ...(search && {
        albumTitle: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    }

    let orderBy: Prisma.AlbumOrderByWithRelationInput[] = []
    switch (order) {
      case AlbumOrder.TITLE:
        orderBy = [{ albumTitle: 'asc' }]
        break
      case AlbumOrder.RELEASE_DATE:
        orderBy = [{ releaseDate: 'desc' }]
        break
      case AlbumOrder.OLDEST:
        orderBy = [{ createdAt: 'asc' }]
        break
      case AlbumOrder.LATEST:
      default:
        orderBy = [{ createdAt: 'desc' }]
        break
    }

    const [albums, total] = await Promise.all([
      this.albumRepo.findAlbums(conditions, skip, limit, orderBy),
      this.albumRepo.countAlbums(conditions),
    ])

    return {
      items: albums.map((album) => ({
        ...album,
        releaseDate: album.releaseDate ? album.releaseDate.toISOString() : null,
        createdAt: album.createdAt.toISOString(),
        updatedAt: album.updatedAt.toISOString(),
      })),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    }
  }

  async getAlbumById(albumId: number, includeSongs = false) {
    const album = await this.albumRepo.findAlbumById(albumId, includeSongs)

    if (!album) {
      throw new NotFoundException(`Album with ID ${albumId} not found`)
    }

    return this.formatAlbumResponse(album, includeSongs)
  }

  async createAlbum(data: CreateAlbumType, userId: number) {
    const labelId = await this.albumRepo.getLabelIdByUserId(userId)
    if (!labelId) {
      throw new ForbiddenException('Only record labels can create albums')
    }

    const album = await this.albumRepo.createAlbum({
      ...data,
      label: {
        connect: { id: labelId },
      },
    })

    this.eventEmitter.emit(SEARCH_SYNC_EVENTS.ALBUM_CREATED, { albumId: Number(album.id) })

    return {
      id: Number(album.id),
      albumTitle: album.albumTitle,
      message: 'Album created successfully',
    }
  }

  async updateAlbum(albumId: number, data: UpdateAlbumType, userId: number) {
    const album = await this.albumRepo.findAlbumById(albumId)

    if (!album) {
      throw new NotFoundException(`Album with ID ${albumId} not found`)
    }

    const labelId = await this.albumRepo.getLabelIdByUserId(userId)
    if (!labelId) {
      throw new ForbiddenException('Only record labels can update albums')
    }

    if (album.labelId && Number(album.labelId) !== labelId) {
      throw new ForbiddenException('You do not have permission to update this album')
    }

    await this.albumRepo.updateAlbum(albumId, data)

    this.eventEmitter.emit(SEARCH_SYNC_EVENTS.ALBUM_UPDATED, { albumId })

    return {
      id: albumId,
      message: 'Album updated successfully',
    }
  }

  async deleteAlbum(albumId: number, userId: number) {
    const album = await this.albumRepo.findAlbumById(albumId)

    if (!album) {
      throw new NotFoundException(`Album with ID ${albumId} not found`)
    }

    const labelId = await this.albumRepo.getLabelIdByUserId(userId)
    if (!labelId) {
      throw new ForbiddenException('Only record labels can delete albums')
    }

    if (album.labelId && Number(album.labelId) !== labelId) {
      throw new ForbiddenException('You do not have permission to delete this album')
    }

    // Detach all songs from this album before deleting
    if (album._count && album._count.songs > 0) {
      await this.albumRepo.detachSongsFromAlbum(albumId)
    }

    await this.albumRepo.deleteAlbum(albumId)

    this.eventEmitter.emit(SEARCH_SYNC_EVENTS.ALBUM_DELETED, { albumId })

    return {
      id: albumId,
      message: 'Album deleted successfully',
    }
  }

  async getAlbumsByLabel(labelId: number) {
    const albums = await this.albumRepo.getAlbumsByLabel(labelId)

    return {
      labelId,
      albums: albums.map((album) => ({
        id: Number(album.id),
        albumTitle: album.albumTitle,
        coverImage: album.coverImage,
        releaseDate: album.releaseDate,
      })),
    }
  }

  private formatAlbumResponse(album: any, includeSongs = false) {
    const response: any = {
      id: Number(album.id),
      albumTitle: album.albumTitle,
      albumDescription: album.albumDescription,
      coverImage: album.coverImage,
      releaseDate: album.releaseDate ? album.releaseDate.toISOString() : null,
      labelId: album.labelId ? Number(album.labelId) : null,
      totalTracks: album.totalTracks,
      createdAt: album.createdAt.toISOString(),
      updatedAt: album.updatedAt.toISOString(),
      label: album.label
        ? {
            id: Number(album.label.id),
            labelName: album.label.labelName,
            hasPublicProfile: album.label.hasPublicProfile,
          }
        : null,
      _count: album._count
        ? {
            songs: album._count.songs,
          }
        : undefined,
    }

    if (includeSongs && album.songs) {
      response.songs = album.songs.map((song: any) => ({
        id: Number(song.id),
        title: song.title,
        duration: song.duration,
        playCount: Number(song.playCount),
        uploadDate: song.uploadDate ? song.uploadDate.toISOString() : null,
        songArtists: song.songArtists?.map((sa: any) => ({
          role: sa.role,
          artist: {
            id: Number(sa.artist.id),
            artistName: sa.artist.artistName,
            profileImage: sa.artist.profileImage,
          },
        })),
      }))
    }

    return response
  }
}
