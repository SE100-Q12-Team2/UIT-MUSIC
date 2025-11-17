import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Prisma } from '@prisma/client'
import { CreateArtistBodyType, GetArtistQueryType, UpdateArtistBodyType } from './artist.model'
import { ArtistRepository } from 'src/routes/artist/artist.repo'
import { ArtistNotFoundError, ArtistAlreadyExistsError } from './artist.error'
import { isNotFoundPrismaError } from 'src/shared/lib'
import { SEARCH_SYNC_EVENTS } from 'src/shared/events/search-sync.events'

@Injectable()
export class ArtistService {
  constructor(
    private readonly repo: ArtistRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async list(query: GetArtistQueryType) {
    return await this.repo.findAll(query)
  }

  async get(id: number) {
    const artist = await this.repo.findById(id)

    if (!artist) {
      throw ArtistNotFoundError
    }

    return artist
  }

  async create(body: CreateArtistBodyType) {
    try {
      const artist = await this.repo.create(body)

      this.eventEmitter.emit(SEARCH_SYNC_EVENTS.ARTIST_CREATED, { artistId: Number(artist.id) })

      return artist
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ArtistAlreadyExistsError
      }
      throw error
    }
  }

  async update(id: number, body: UpdateArtistBodyType) {
    try {
      const artist = await this.repo.update(id, body)

      this.eventEmitter.emit(SEARCH_SYNC_EVENTS.ARTIST_UPDATED, { artistId: id })

      return artist
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw ArtistNotFoundError
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ArtistAlreadyExistsError
      }
      throw error
    }
  }

  async remove(id: number) {
    try {
      const result = await this.repo.delete(id)

      this.eventEmitter.emit(SEARCH_SYNC_EVENTS.ARTIST_DELETED, { artistId: id })

      return result
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw ArtistNotFoundError
      }
      throw error
    }
  }
}
