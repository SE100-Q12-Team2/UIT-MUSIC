import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { SongRepository } from './song.repo'
import { Prisma } from '@prisma/client'
import {
  GetSongsQueryType,
  GetTrendingSongsQueryType,
  CreateSongType,
  UpdateSongType,
  UpdateSongArtistsType,
} from './song.model'
import { SongOrder } from 'src/shared/constants/song.constant'
import { EntityExistsValidator, EntityType } from 'src/shared/validators/entity-exists.validator'
import { SEARCH_SYNC_EVENTS } from 'src/shared/events/search-sync.events'

@Injectable()
export class SongService {
  constructor(
    private readonly songRepo: SongRepository,
    private readonly entityValidator: EntityExistsValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getSongs(query: GetSongsQueryType, userId?: number) {
    const { page, limit, genreId, artistId, albumId, labelId, language, order } = query
    const skip = (page - 1) * limit

    const conditions: Prisma.SongWhereInput = {
      isActive: true,
      ...(genreId && { genreId }),
      ...(albumId && { albumId }),
      ...(labelId && { labelId }),
      ...(language && { language }),
      ...(artistId && {
        songArtists: {
          some: {
            artistId,
          },
        },
      }),
    }

    let orderBy: Prisma.SongOrderByWithRelationInput[] = []
    switch (order) {
      case SongOrder.POPULAR:
        orderBy = [{ playCount: 'desc' }]
        break
      case SongOrder.TITLE:
        orderBy = [{ title: 'asc' }]
        break
      case SongOrder.LATEST:
      default:
        orderBy = [{ uploadDate: 'desc' }]
        break
    }

    const [songs, total] = await Promise.all([
      this.songRepo.findSongs(conditions, skip, limit, orderBy, userId),
      this.songRepo.countSongs(conditions),
    ])

    return {
      items: songs,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    }
  }

  async getSongById(songId: number, userId?: number) {
    const song = await this.songRepo.findSongById(songId, userId)

    if (!song) {
      throw new NotFoundException(`Song with ID ${songId} not found`)
    }

    if (!song.isActive) {
      throw new NotFoundException(`Song with ID ${songId} is not available`)
    }

    return song
  }

  async createSong(data: CreateSongType, userId: number) {
    const { artists, albumId, genreId, ...songData } = data

    const labelId = await this.songRepo.getLabelIdByUserId(userId)
    if (!labelId) {
      throw new ForbiddenException('Only record labels can create songs')
    }

    await this.entityValidator.validateOptionalId(albumId, EntityType.ALBUM)
    await this.entityValidator.validateOptionalId(genreId, EntityType.GENRE)

    const artistIds = artists.map((a) => a.artistId)
    await this.entityValidator.validateMultipleIds(artistIds, EntityType.ARTIST, 'artists')

    const song = await this.songRepo.createSong({
      ...songData,
      label: {
        connect: { id: labelId },
      },
      ...(albumId && {
        album: {
          connect: { id: albumId },
        },
      }),
      ...(genreId && {
        genre: {
          connect: { id: genreId },
        },
      }),
    })

    await this.songRepo.createSongArtistsFromAssignments(song.id, artists)

    this.eventEmitter.emit(SEARCH_SYNC_EVENTS.SONG_CREATED, { songId: Number(song.id) })

    return {
      id: Number(song.id),
      title: song.title,
      message: 'Song created successfully',
    }
  }

  async updateSong(songId: number, data: UpdateSongType, userId: number) {
    const song = await this.songRepo.findSongById(songId)

    if (!song) {
      throw new NotFoundException(`Song with ID ${songId} not found`)
    }

    const labelId = await this.songRepo.getLabelIdByUserId(userId)
    if (!labelId) {
      throw new ForbiddenException('Only record labels can update songs')
    }

    if (Number(song.labelId) !== labelId) {
      throw new ForbiddenException('You do not have permission to update this song')
    }

    await this.entityValidator.validateOptionalId(data.albumId, EntityType.ALBUM)
    await this.entityValidator.validateOptionalId(data.genreId, EntityType.GENRE)

    await this.songRepo.updateSong(songId, data)

    this.eventEmitter.emit(SEARCH_SYNC_EVENTS.SONG_UPDATED, { songId })

    return {
      id: songId,
      message: 'Song updated successfully',
    }
  }

  async updateSongArtists(songId: number, data: UpdateSongArtistsType, userId: number) {
    const song = await this.songRepo.findSongById(songId)

    if (!song) {
      throw new NotFoundException(`Song with ID ${songId} not found`)
    }

    const labelId = await this.songRepo.getLabelIdByUserId(userId)
    if (!labelId) {
      throw new ForbiddenException('Only record labels can update songs')
    }

    if (Number(song.labelId) !== labelId) {
      throw new ForbiddenException('You do not have permission to update this song')
    }

    const { artists } = data

    const artistIds = artists.map((a) => a.artistId)
    await this.entityValidator.validateMultipleIds(artistIds, EntityType.ARTIST, 'artists')

    await this.songRepo.deleteSongArtists(songId)
    await this.songRepo.createSongArtistsFromAssignments(songId, artists)

    return {
      id: songId,
      message: 'Song artists updated successfully',
    }
  }

  async deleteSong(songId: number, userId: number) {
    const song = await this.songRepo.findSongById(songId)

    if (!song) {
      throw new NotFoundException(`Song with ID ${songId} not found`)
    }

    const labelId = await this.songRepo.getLabelIdByUserId(userId)
    if (!labelId) {
      throw new ForbiddenException('Only record labels can delete songs')
    }

    if (Number(song.labelId) !== labelId) {
      throw new ForbiddenException('You do not have permission to delete this song')
    }

    await this.songRepo.deleteSong(songId)

    return {
      id: songId,
      message: 'Song deleted successfully',
    }
  }

  async incrementPlayCount(songId: number) {
    const exists = await this.songRepo.checkSongExists(songId)

    if (!exists) {
      throw new NotFoundException(`Song with ID ${songId} not found`)
    }

    const result = await this.songRepo.incrementPlayCount(songId)

    return {
      songId: Number(result.id),
      playCount: Number(result.playCount),
      message: 'Play count incremented',
    }
  }

  async getTrendingSongs(query: GetTrendingSongsQueryType, userId?: number) {
    const { limit, genreId } = query

    const songs = await this.songRepo.findTrendingSongs(limit, genreId, userId)

    return {
      items: songs,
    }
  }
}
