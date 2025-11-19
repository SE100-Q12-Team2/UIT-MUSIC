import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma, Rating } from '@prisma/client'
import { QueryUserRatingsDto } from './user-song-rating.model'
import { RatingNotFoundException } from './user-song-rating.error'

@Injectable()
export class UserSongRatingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: number; songId: number; rating: Rating }) {
    return this.prisma.userSongRating.create({
      data: {
        userId: data.userId,
        songId: data.songId,
        rating: data.rating,
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
            songArtists: {
              select: {
                artist: {
                  select: {
                    artistName: true,
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
            songArtists: {
              select: {
                artist: {
                  select: {
                    artistName: true,
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
              songArtists: {
                select: {
                  artist: {
                    select: {
                      artistName: true,
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
            artist: rating.song.songArtists[0]?.artist.artistName,
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

  async findLikedSongs(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const where: Prisma.UserSongRatingWhereInput = {
      userId,
      rating: Rating.Like,
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
              songArtists: {
                select: {
                  artist: {
                    select: {
                      artistName: true,
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
            artist: rating.song.songArtists[0]?.artist.artistName,
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

  async update(userId: number, songId: number, rating: Rating) {
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
              songArtists: {
                select: {
                  artist: {
                    select: {
                      artistName: true,
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
    const [totalRatings, likes, dislikes, userRating] = await Promise.all([
      this.prisma.userSongRating.count({
        where: { songId },
      }),
      this.prisma.userSongRating.count({
        where: { songId, rating: Rating.Like },
      }),
      this.prisma.userSongRating.count({
        where: { songId, rating: Rating.Dislike },
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

    const likePercentage = totalRatings > 0 ? (likes / totalRatings) * 100 : 0
    const dislikePercentage = totalRatings > 0 ? (dislikes / totalRatings) * 100 : 0

    return {
      songId,
      totalRatings,
      likes,
      dislikes,
      likePercentage: parseFloat(likePercentage.toFixed(2)),
      dislikePercentage: parseFloat(dislikePercentage.toFixed(2)),
      userRating: userRating?.rating || null,
    }
  }

  async getUserRatingStats(userId: number) {
    const [totalRatings, totalLikes, totalDislikes, recentRatings] = await Promise.all([
      this.prisma.userSongRating.count({
        where: { userId },
      }),
      this.prisma.userSongRating.count({
        where: { userId, rating: Rating.Like },
      }),
      this.prisma.userSongRating.count({
        where: { userId, rating: Rating.Dislike },
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

    return {
      totalRatings,
      totalLikes,
      totalDislikes,
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
