import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma, Rating } from '@prisma/client'
import { QueryUserRatingsDto } from './user-song-rating.model'
import { RatingNotFoundException } from './user-song-rating.error'

@Injectable()
export class UserSongRatingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: number; songId: number; rating: Rating; comment?: string }) {
    return this.prisma.userSongRating.create({
      data: {
        userId: data.userId,
        songId: data.songId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            duration: true,
            album: {
              select: {
                id: true,
                albumTitle: true,
                coverImage: true,
              },
            },
            contributors: {
              select: {
                label: {
                  select: {
                    labelName: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    })
  }

  async findByUserAndSong(userId: number, songId: number) {
    return this.prisma.userSongRating.findUnique({
      where: {
        userId_songId: {
          userId,
          songId,
        },
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            duration: true,
            album: {
              select: {
                id: true,
                albumTitle: true,
                coverImage: true,
              },
            },
            contributors: {
              select: {
                label: {
                  select: {
                    labelName: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    })
  }

  async findUserRatings(userId: number, query: QueryUserRatingsDto) {
    const { page, limit, rating, sortBy, sortOrder } = query
    const skip = (page - 1) * limit

    const where: Prisma.UserSongRatingWhereInput = {
      userId,
      ...(rating && { rating }),
    }

    const orderBy: Prisma.UserSongRatingOrderByWithRelationInput =
      sortBy === 'songTitle' ? { song: { title: sortOrder } } : { ratedAt: sortOrder }

    const [data, total] = await Promise.all([
      this.prisma.userSongRating.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          song: {
            select: {
              id: true,
              title: true,
              duration: true,
              album: {
                select: {
                  id: true,
                  albumTitle: true,
                  coverImage: true,
                },
              },
              contributors: {
                select: {
                  label: {
                    select: {
                      labelName: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.userSongRating.count({ where }),
    ])

    const transformedData = data.map((rating) => ({
      ...rating,
      song: rating.song
        ? {
            id: rating.song.id,
            title: rating.song.title,
            duration: rating.song.duration,
            label: rating.song.contributors[0]?.label.labelName,
            album: rating.song.album,
          }
        : undefined,
    }))

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findSongRatings(songId: number, query: QueryUserRatingsDto) {
    const { page, limit, rating, sortBy, sortOrder } = query
    const skip = (page - 1) * limit

    const where: Prisma.UserSongRatingWhereInput = {
      songId,
      ...(rating && { rating }),
    }

    const orderBy: Prisma.UserSongRatingOrderByWithRelationInput =
      sortBy === 'songTitle' ? { song: { title: sortOrder } } : { ratedAt: sortOrder }

    const [data, total] = await Promise.all([
      this.prisma.userSongRating.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
        },
      }),
      this.prisma.userSongRating.count({ where }),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findLikedSongs(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const where: Prisma.UserSongRatingWhereInput = {
      userId,
      rating: {
        in: [Rating.THREE_STAR, Rating.FOUR_STAR, Rating.FIVE_STAR],
      },
    }

    const [data, total] = await Promise.all([
      this.prisma.userSongRating.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          ratedAt: 'desc',
        },
        include: {
          song: {
            select: {
              id: true,
              title: true,
              duration: true,
              album: {
                select: {
                  id: true,
                  albumTitle: true,
                  coverImage: true,
                },
              },
              contributors: {
                select: {
                  label: {
                    select: {
                      labelName: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.userSongRating.count({ where }),
    ])

    const transformedData = data.map((rating) => ({
      ...rating,
      song: rating.song
        ? {
            id: rating.song.id,
            title: rating.song.title,
            duration: rating.song.duration,
            label: rating.song.contributors[0]?.label.labelName,
            album: rating.song.album,
          }
        : undefined,
    }))

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async update(userId: number, songId: number, rating: Rating, comment?: string) {
    try {
      return await this.prisma.userSongRating.update({
        where: {
          userId_songId: {
            userId,
            songId,
          },
        },
        data: {
          rating,
          comment,
          ratedAt: new Date(),
        },
        include: {
          song: {
            select: {
              id: true,
              title: true,
              duration: true,
              album: {
                select: {
                  id: true,
                  albumTitle: true,
                  coverImage: true,
                },
              },
              contributors: {
                select: {
                  label: {
                    select: {
                      labelName: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw RatingNotFoundException
        }
      }
      throw error
    }
  }

  async delete(userId: number, songId: number) {
    try {
      return await this.prisma.userSongRating.delete({
        where: {
          userId_songId: {
            userId,
            songId,
          },
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw RatingNotFoundException
        }
      }
      throw error
    }
  }

  async getSongRatingStats(songId: number, userId?: number) {
    const [totalRatings, oneStar, twoStar, threeStar, fourStar, fiveStar, userRating] = await Promise.all([
      this.prisma.userSongRating.count({
        where: { songId },
      }),
      this.prisma.userSongRating.count({
        where: { songId, rating: Rating.ONE_STAR },
      }),
      this.prisma.userSongRating.count({
        where: { songId, rating: Rating.TWO_STAR },
      }),
      this.prisma.userSongRating.count({
        where: { songId, rating: Rating.THREE_STAR },
      }),
      this.prisma.userSongRating.count({
        where: { songId, rating: Rating.FOUR_STAR },
      }),
      this.prisma.userSongRating.count({
        where: { songId, rating: Rating.FIVE_STAR },
      }),
      userId
        ? this.prisma.userSongRating.findUnique({
            where: {
              userId_songId: {
                userId,
                songId,
              },
            },
            select: { rating: true },
          })
        : null,
    ])

    const ratingSum = oneStar * 1 + twoStar * 2 + threeStar * 3 + fourStar * 4 + fiveStar * 5
    const averageRating = totalRatings > 0 ? parseFloat((ratingSum / totalRatings).toFixed(2)) : 0

    return {
      songId,
      totalRatings,
      averageRating,
      oneStar,
      twoStar,
      threeStar,
      fourStar,
      fiveStar,
      userRating: userRating?.rating || null,
    }
  }

  async getUserRatingStats(userId: number) {
    const [totalRatings, allRatings, recentRatings] = await Promise.all([
      this.prisma.userSongRating.count({
        where: { userId },
      }),
      this.prisma.userSongRating.findMany({
        where: { userId },
        select: { rating: true },
      }),
      this.prisma.userSongRating.findMany({
        where: { userId },
        take: 10,
        orderBy: { ratedAt: 'desc' },
        include: {
          song: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ])

    const ratingMap = {
      [Rating.ONE_STAR]: 1,
      [Rating.TWO_STAR]: 2,
      [Rating.THREE_STAR]: 3,
      [Rating.FOUR_STAR]: 4,
      [Rating.FIVE_STAR]: 5,
    }
    const ratingSum = allRatings.reduce((sum, r) => sum + ratingMap[r.rating], 0)
    const averageRating = totalRatings > 0 ? parseFloat((ratingSum / totalRatings).toFixed(2)) : 0

    return {
      totalRatings,
      averageRating,
      recentlyRated: recentRatings.map((r) => ({
        songId: r.songId,
        songTitle: r.song.title,
        rating: r.rating,
        ratedAt: r.ratedAt.toISOString(),
      })),
    }
  }

  async checkSongExists(songId: number) {
    const song = await this.prisma.song.findUnique({
      where: { id: songId },
      select: { id: true, isActive: true },
    })
    return song
  }
}
