import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
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
        ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
        ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}),
      }
    }

    if (query.updatedFrom || query.updatedTo) {
      where.updatedAt = {
        ...(query.updatedFrom ? { gte: new Date(query.updatedFrom) } : {}),
        ...(query.updatedTo ? { lte: new Date(query.updatedTo) } : {}),
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
    return await this.prisma.artist.findUnique({ where: { id } })
  }

  async create(body: CreateArtistBodyType): Promise<CreateArtistResType> {
    return await this.prisma.artist.create({
      data: {
        artistName: body.artistName,
        biography: body.biography ?? null,
        profileImage: body.profileImage ?? null,
        hasPublicProfile: body.hasPublicProfile ?? true,
      },
    })
  }

  async update(id: number, body: Partial<UpdateArtistBodyType>) {
    const updateData: Prisma.ArtistUpdateInput = {}

    if (body.artistName !== undefined) updateData.artistName = body.artistName
    if (body.biography !== undefined) updateData.biography = body.biography
    if (body.profileImage !== undefined) updateData.profileImage = body.profileImage
    if (body.hasPublicProfile !== undefined) updateData.hasPublicProfile = body.hasPublicProfile

    return await this.prisma.artist.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: number) {
    await this.prisma.artist.delete({ where: { id } })
    return { message: 'Artist deleted successfully' }
  }
}
