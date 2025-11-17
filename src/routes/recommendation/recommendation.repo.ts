import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class RecommendationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserListeningHistory(userId: number, limit: number) {
    return this.prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      select: { songId: true, playedAt: true },
      take: limit,
    })
  }

  async getUserFavorites(userId: number) {
    return this.prisma.favorite.findMany({
      where: { userId },
      select: { songId: true },
    })
  }

  async getUserRatings(userId: number) {
    return this.prisma.userSongRating.findMany({
      where: { userId },
      select: { songId: true, rating: true },
    })
  }

  async findSimilarUsersBySongs(userSongIds: number[], excludeUserId: number, limit: number = 50) {
    return this.prisma.listeningHistory.groupBy({
      by: ['userId'],
      where: {
        songId: { in: userSongIds },
        userId: { not: excludeUserId },
      },
      _count: { songId: true },
      orderBy: { _count: { songId: 'desc' } },
      take: limit,
    })
  }

  async getUserListenedSongs(userId: number, excludeSongIds: number[], limit: number = 20) {
    return this.prisma.listeningHistory.findMany({
      where: {
        userId,
        songId: { notIn: excludeSongIds },
      },
      select: { songId: true },
      distinct: ['songId'],
      take: limit,
    })
  }

  async getGenrePreferences(songIds: number[]) {
    return this.prisma.song.groupBy({
      by: ['genreId'],
      where: {
        id: { in: songIds },
        genreId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })
  }

  async getArtistPreferences(songIds: number[]) {
    return this.prisma.songArtist.groupBy({
      by: ['artistId'],
      where: { songId: { in: songIds } },
      _count: { songId: true },
      orderBy: { _count: { songId: 'desc' } },
      take: 10,
    })
  }

  async findSongsByGenres(genreIds: number[], limit: number = 100) {
    return this.prisma.song.findMany({
      where: {
        genreId: { in: genreIds },
        isActive: true,
      },
      select: { id: true, genreId: true },
      take: limit,
    })
  }

  async findSongsByArtists(artistIds: number[], limit: number = 100) {
    return this.prisma.songArtist.findMany({
      where: {
        artistId: { in: artistIds },
      },
      select: { songId: true, artistId: true },
      take: limit,
    })
  }

  async getTrendingSongs(limit: number = 50) {
    return this.prisma.song.findMany({
      where: { isActive: true },
      orderBy: { playCount: 'desc' },
      select: { id: true, playCount: true },
      take: limit,
    })
  }

  async findSongById(songId: number) {
    return this.prisma.song.findUnique({
      where: { id: songId },
      include: {
        songArtists: { select: { artistId: true } },
        genre: true,
        album: true,
      },
    })
  }

  async findSongsByGenre(genreId: number, excludeSongId: number, limit: number = 30) {
    return this.prisma.song.findMany({
      where: {
        genreId,
        id: { not: excludeSongId },
        isActive: true,
      },
      select: { id: true },
      take: limit,
    })
  }

  async findSongsByArtistIds(artistIds: number[], excludeSongId: number, limit: number = 30) {
    return this.prisma.songArtist.findMany({
      where: {
        artistId: { in: artistIds },
        songId: { not: excludeSongId },
      },
      select: { songId: true },
      distinct: ['songId'],
      take: limit,
    })
  }

  async findSongsByAlbum(albumId: number, excludeSongId: number) {
    return this.prisma.song.findMany({
      where: {
        albumId,
        id: { not: excludeSongId },
        isActive: true,
      },
      select: { id: true },
    })
  }
}
