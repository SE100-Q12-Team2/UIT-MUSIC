import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { CreateArtistBodyType, GetArtistQueryType, UpdateArtistBodyType } from './artist.model'
import { ArtistRepository } from 'src/routes/artist/artist.repo'
import { ArtistNotFoundError, ArtistAlreadyExistsError } from './artist.error'
import { isNotFoundPrismaError } from 'src/shared/lib'

@Injectable()
export class ArtistService {
  constructor(private readonly repo: ArtistRepository) {}

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
      return await this.repo.create(body)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ArtistAlreadyExistsError
      }
      throw error
    }
  }

  async update(id: number, body: UpdateArtistBodyType) {
    try {
      return await this.repo.update(id, body)
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
      return await this.repo.delete(id)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw ArtistNotFoundError
      }
      throw error
    }
  }
}
