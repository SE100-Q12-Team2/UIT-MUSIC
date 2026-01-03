import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  CreatePlaylistResType,
  GetAllPlaylistResType,
  GetPlaylistQueryType,
  UpdatePlaylistBodyType,
} from 'src/routes/playlist/playlist.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class PlaylistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetPlaylistQueryType): Promise<GetAllPlaylistResType> {
    const limit = Math.min(query.limit ?? 20, 50)
    const skip = ((query.page ?? 1) - 1) * limit

    const where: Prisma.PlaylistWhereInput = {}

    if (query.ownerId) where.userId = Number(query.ownerId)
    if (typeof query.isPublic === 'boolean') where.isPublic = query.isPublic

    if (query.q && query.q.trim().length) {
      const q = query.q.trim()
      Object.assign(where, {
        OR: [
          { playlistName: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tags: { has: q } },
        ],
      })
    }

    const orderBy: { [key: string]: 'asc' | 'desc' } = { [query.sort]: query.order }

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.playlist.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        include: {
          playlistSongs: {
            include: {
              song: true,
            },
          },
        },
      }),
      this.prisma.playlist.count({ where }),
    ])

    return {
      data: data.map((playlist) => ({
        ...playlist,
        createdAt: playlist.createdAt.toISOString(),
        updatedAt: playlist.updatedAt.toISOString(),
      })),
      page: query.page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      limit,
    }
  }

  async findById(id: number) {
    return await this.prisma.playlist.findUnique({
      where: { id },
    })
  }

  async create(body): Promise<CreatePlaylistResType> {
    const playlist = await this.prisma.playlist.create({
      data: body,
    })
    return {
      ...playlist,
      createdAt: playlist.createdAt.toISOString(),
      updatedAt: playlist.updatedAt.toISOString(),
    }
  }

  async update(id: number, body: Partial<UpdatePlaylistBodyType>) {
    return await this.prisma.playlist.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })
  }

  async delete(id: number) {
    await this.prisma.playlist.delete({
      where: { id },
    })

    return {
      message: 'Playlist deleted successfully',
    }
  }
}
