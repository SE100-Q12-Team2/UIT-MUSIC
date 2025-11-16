import { Injectable, Logger } from '@nestjs/common'
import { UserSongRatingRepository } from './user-song-rating.repo'
import { Rating } from '@prisma/client'
import { CreateRatingDto, UpdateRatingDto, QueryUserRatingsDto } from './user-song-rating.dto'
import { SongNotFoundException } from './user-song-rating.error'

@Injectable()
export class UserSongRatingService {
  private readonly logger = new Logger(UserSongRatingService.name)

  constructor(private readonly repository: UserSongRatingRepository) {}

  async createOrUpdateRating(userId: number, data: CreateRatingDto) {
    const song = await this.repository.checkSongExists(data.songId)
    if (!song) {
      throw SongNotFoundException
    }

    const existingRating = await this.repository.findByUserAndSong(userId, data.songId)

    let result
    if (existingRating) {
      result = await this.repository.update(userId, data.songId, data.rating)
      this.logger.log(`Updated rating for song ${data.songId} by user ${userId}: ${data.rating}`)
    } else {
      result = await this.repository.create({
        userId,
        songId: data.songId,
        rating: data.rating,
      })
      this.logger.log(`Created rating for song ${data.songId} by user ${userId}: ${data.rating}`)
    }

    return this.transformRating(result)
  }

  async updateRating(userId: number, songId: number, data: UpdateRatingDto) {
    const existingRating = await this.repository.findByUserAndSong(userId, songId)
    if (!existingRating) {
      return this.createOrUpdateRating(userId, { songId, rating: data.rating })
    }

    const updated = await this.repository.update(userId, songId, data.rating)

    this.logger.log(`Updated rating for song ${songId} by user ${userId} to ${data.rating}`)

    return this.transformRating(updated)
  }

  async deleteRating(userId: number, songId: number) {
    await this.repository.delete(userId, songId)

    this.logger.log(`Deleted rating for song ${songId} by user ${userId}`)

    return {
      success: true,
      message: 'Rating deleted successfully',
    }
  }

  async getUserRating(userId: number, songId: number) {
    const rating = await this.repository.findByUserAndSong(userId, songId)

    if (!rating) {
      return {
        data: [],
        limit: 0,
        page: 0,
        totalItems: 0,
        totalPages: 0,
      }
    }

    return this.transformRating(rating)
  }

  async getUserRatings(userId: number, query: QueryUserRatingsDto) {
    const result = await this.repository.findUserRatings(userId, query)

    this.logger.log(`Retrieved ${result.data.length} ratings for user ${userId}`)

    return result
  }

  async getLikedSongs(userId: number, page: number = 1, limit: number = 20) {
    const result = await this.repository.findLikedSongs(userId, page, limit)

    this.logger.log(`Retrieved ${result.data.length} liked songs for user ${userId}`)

    return result
  }

  async getSongRatingStats(songId: number, userId?: number) {
    const song = await this.repository.checkSongExists(songId)
    if (!song) {
      throw SongNotFoundException
    }

    const stats = await this.repository.getSongRatingStats(songId, userId)

    this.logger.log(`Retrieved rating stats for song ${songId}`)

    return stats
  }

  async getUserRatingStats(userId: number) {
    const stats = await this.repository.getUserRatingStats(userId)

    this.logger.log(`Retrieved rating stats for user ${userId}`)

    return stats
  }

  private transformRating(rating: any) {
    return {
      ...rating,
      song: rating.song
        ? {
            id: rating.song.id,
            title: rating.song.title,
            duration: rating.song.duration,
            artist: rating.song.songArtists?.[0]?.artist?.artistName,
            album: rating.song.album,
          }
        : undefined,
    }
  }
}
