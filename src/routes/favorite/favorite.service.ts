import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { AddFavoriteBodyType, GetFavoritesQueryType } from 'src/routes/favorite/favorite.model'
import { FavoriteRepository } from 'src/routes/favorite/favorite.repo'

@Injectable()
export class FavoriteService {
  constructor(
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  async getUserFavorites(query: GetFavoritesQueryType) {
    return await this.favoriteRepository.findAll(query)
  }

  async checkFavorite(userId: number, songId: number) {
    return await this.favoriteRepository.checkFavorite(userId, songId)
  }

  async addFavorite(body: AddFavoriteBodyType) {
    const existing = await this.favoriteRepository.findByUserAndSong(body.userId, body.songId)

    if (existing) {
      throw new ConflictException('Song is already in favorites')
    }

    return await this.favoriteRepository.add(body)
  }

  async removeFavorite(userId: number, songId: number) {
    const favorite = await this.favoriteRepository.findByUserAndSong(userId, songId)

    if (!favorite) {
      throw new NotFoundException('Favorite not found')
    }

    return await this.favoriteRepository.remove(userId, songId)
  }

  async getUserFavoriteCount(userId: number) {
    const count = await this.favoriteRepository.countByUser(userId)
    return {
      userId,
      totalFavorites: count,
    }
  }

  async getUserFavoriteSongIds(userId: number) {
    const songIds = await this.favoriteRepository.getUserFavoriteSongs(userId)
    return {
      userId,
      songIds,
    }
  }
}
