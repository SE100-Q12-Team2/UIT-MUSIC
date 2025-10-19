import { Injectable } from '@nestjs/common'
import { GetAllPlaylistResType, GetPlaylistQueryType } from 'src/routes/playlist/playlist.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class PlaylistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetPlaylistQueryType): Promise<GetAllPlaylistResType> {
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.playlist.findMany({
        where: {
          ...(query.ownerId && { userId: query.ownerId }),
          ...(query.isPublic !== undefined && { isPublic: query.isPublic }),
          ...(query.tags && { tags: { hasSome: query.tags } }),
        },
        orderBy: {
          [query.sort]: query.order,
        },
        take: query.limit,
        skip: (query.page - 1) * query.limit,
      }),
      this.prisma.playlist.count({
        where: {
          ...(query.ownerId && { userId: query.ownerId }),
          ...(query.isPublic !== undefined && { isPublic: query.isPublic }),
          ...(query.tags && { tags: { hasSome: query.tags } }),
        },
      }),
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
    return this.prisma.playlist.findUnique({
      where: { id },
    })
  }
}
