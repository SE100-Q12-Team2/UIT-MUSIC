import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, PrismaClient } from '@prisma/client'
import {
  CreateArtistBodyType,
  CreateArtistResType,
  GetArtistQueryType,
  GetArtistsResponseType,
  UpdateArtistBodyType,
} from './artist.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class ArtistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetArtistQueryType): Promise<GetArtistsResponseType> {
    const where: Prisma.ArtistWhereInput = {}

    if (typeof query.hasPublicProfile === 'boolean') {
      where.hasPublicProfile = query.hasPublicProfile
    }

    if (query.q && query.q.trim()) {
      where.artistName = { contains: query.q.trim(), mode: Prisma.QueryMode.insensitive }
    }

    if (query.createdFrom || query.createdTo) {
      where.createdAt = {
        ...(query.createdFrom ? { gte: query.createdFrom } : {}),
        ...(query.createdTo ? { lte: query.createdTo } : {}),
      }
    }

    if (query.updatedFrom || query.updatedTo) {
      where.updatedAt = {
        ...(query.updatedFrom ? { gte: query.updatedFrom } : {}),
        ...(query.updatedTo ? { lte: query.updatedTo } : {}),
      }
    }

    const orderBy: Prisma.ArtistOrderByWithRelationInput[] = [{ [query.sort]: query.order }]

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.artist.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.artist.count({ where }),
    ])

    return {
      data,
      page: query.page,
      totalPages: Math.ceil(totalItems / query.limit),
      totalItems,
      limit: query.limit,
    }
  }

  async findById(id: number) {
    const artist = await this.prisma.artist.findUnique({ where: { id } })
    if (!artist) throw new NotFoundException('Artist not found')
    return artist
  }

  async create(body: CreateArtistBodyType): Promise<CreateArtistResType> {
    return this.prisma.artist.create({ data: body })
  }

  async update(id: number, body: Partial<UpdateArtistBodyType>) {
    await this.findById(id)
    return this.prisma.artist.update({
      where: { id },
      data: { ...body },
    })
  }

  async delete(id: number) {
    await this.findById(id)
    await this.prisma.artist.delete({ where: { id } })
    return { message: 'Artist deleted successfully' }
  }
}
