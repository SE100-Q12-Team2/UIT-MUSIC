import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  AddFavoriteBodyType,
  CheckFavoriteResType,
  GetFavoritesQueryType,
  GetFavoritesResponseType,
} from 'src/routes/favorite/favorite.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class FavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetFavoritesQueryType): Promise<GetFavoritesResponseType> {
    const limit = Math.min(Number(query.limit) || 20, 100)
    const skip = ((Number(query.page) || 1) - 1) * limit

    const where: Prisma.FavoriteWhereInput = {}

    if (query.userId) {
      where.userId = Number(query.userId)
    }

    const songWhere: Prisma.SongWhereInput = {
      isActive: true,
    }

    if (query.genreId) {
      songWhere.genreId = Number(query.genreId)
    }

    if (query.language) {
      songWhere.language = query.language
    }

    if (query.genreId || query.language) {
      where.song = songWhere
    }
    let orderBy: Prisma.FavoriteOrderByWithRelationInput = {}

    if (query.sort === 'likedAt') {
      orderBy = { likedAt: query.order }
    } else if (query.sort === 'title') {
      orderBy = { song: { title: query.order } }
    } else if (query.sort === 'playCount') {
      orderBy = { song: { playCount: query.order } }
    }

    const [favorites, totalItems] = await this.prisma.$transaction([
      this.prisma.favorite.findMany({
        where,
        include: {
          song: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
              language: true,
              albumId: true,
              genreId: true,
              uploadDate: true,
              playCount: true,
              isActive: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip,
      }),
      this.prisma.favorite.count({ where }),
    ])

    const formattedFavorites = favorites.map((favorite) => ({
      ...favorite,
      song: {
        ...favorite.song,
        playCount: Number(favorite.song.playCount),
      },
    }))

    return {
      data: formattedFavorites as any,
      page: Number(query.page) || 1,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      limit,
    }
  }

  async findByUserAndSong(userId: number, songId: number) {
    return await this.prisma.favorite.findUnique({
      where: {
        userId_songId: {
          userId: userId,
          songId: songId,
        },
      },
    })
  }

  async checkFavorite(userId: number, songId: number): Promise<CheckFavoriteResType> {
    const favorite = await this.findByUserAndSong(userId, songId)

    return {
      isFavorite: !!favorite,
      likedAt: favorite?.likedAt ?? null,
    }
  }

  async add(body: AddFavoriteBodyType) {
    return await this.prisma.favorite.create({
      data: {
        userId: body.userId,
        songId: body.songId,
      },
    })
  }

  async remove(userId: number, songId: number) {
    await this.prisma.favorite.delete({
      where: {
        userId_songId: {
          userId: userId,
          songId: songId,
        },
      },
    })

    return {
      message: 'Favorite removed successfully',
    }
  }

  async countByUser(userId: number): Promise<number> {
    return await this.prisma.favorite.count({
      where: {
        userId: userId,
      },
    })
  }

  async getUserFavoriteSongs(userId: number): Promise<number[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId: userId,
      },
      select: {
        songId: true,
      },
    })

    return favorites.map((fav) => fav.songId)
  }
}
