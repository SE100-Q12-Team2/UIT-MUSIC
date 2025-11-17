import { Injectable } from '@nestjs/common'
import { RecommendationRepository } from './recommendation.repo'
import { SongRepository } from '../song/song.repo'

interface RecommendationScore {
  songId: number
  score: number
  reasons: string[]
}

@Injectable()
export class RecommendationService {
  constructor(
    private readonly recommendationRepo: RecommendationRepository,
    private readonly songRepo: SongRepository,
  ) {}

  async getPersonalizedRecommendations(userId: number, limit: number = 20) {
    const [listeningHistory, favorites, userRatings] = await Promise.all([
      this.recommendationRepo.getUserListeningHistory(userId, 100),
      this.recommendationRepo.getUserFavorites(userId),
      this.recommendationRepo.getUserRatings(userId),
    ])

    const collaborativeScores = await this.getCollaborativeFilteringScores(userId, listeningHistory)
    const contentBasedScores = await this.getContentBasedScores(userId, listeningHistory, favorites)
    const trendingScores = await this.getTrendingScores()

    const combinedScores = this.combineScores([
      { scores: collaborativeScores, weight: 0.4 },
      { scores: contentBasedScores, weight: 0.4 },
      { scores: trendingScores, weight: 0.2 },
    ])

    const listenedSongIds = new Set([...listeningHistory.map((h) => h.songId), ...favorites.map((f) => f.songId)])

    const recommendations = combinedScores.filter((item) => !listenedSongIds.has(item.songId)).slice(0, limit)

    return this.fetchSongDetails(recommendations)
  }

  private async getCollaborativeFilteringScores(userId: number, listeningHistory: any[]) {
    const scores: Map<number, RecommendationScore> = new Map()

    const userSongIds = listeningHistory.map((h) => h.songId)

    if (userSongIds.length === 0) return []

    const similarUsers = await this.recommendationRepo.findSimilarUsersBySongs(userSongIds, userId, 50)

    for (const similarUser of similarUsers) {
      const similarity = similarUser._count.songId / userSongIds.length

      const theirSongs = await this.recommendationRepo.getUserListenedSongs(similarUser.userId, userSongIds, 20)

      theirSongs.forEach(({ songId }) => {
        const existing = scores.get(songId)
        const score = similarity * 10

        if (existing) {
          existing.score += score
          existing.reasons.push('Similar users enjoyed this')
        } else {
          scores.set(songId, {
            songId,
            score,
            reasons: ['Similar users enjoyed this'],
          })
        }
      })
    }

    return Array.from(scores.values())
  }

  private async getContentBasedScores(userId: number, listeningHistory: any[], favorites: any[]) {
    const scores: Map<number, RecommendationScore> = new Map()

    const preferredGenres = await this.getUserPreferredGenres(userId, listeningHistory)
    const preferredArtists = await this.getUserPreferredArtists(userId, listeningHistory, favorites)

    if (preferredGenres.length > 0) {
      const genreSongs = await this.recommendationRepo.findSongsByGenres(
        preferredGenres.map((g) => g.genreId),
        100,
      )

      genreSongs.forEach((song) => {
        const genrePref = preferredGenres.find((g) => g.genreId === song.genreId)
        const score = (genrePref?.weight || 0) * 8

        scores.set(song.id, {
          songId: song.id,
          score,
          reasons: ['Matches your favorite genres'],
        })
      })
    }

    if (preferredArtists.length > 0) {
      const artistSongs = await this.recommendationRepo.findSongsByArtists(
        preferredArtists.map((a) => a.artistId),
        100,
      )

      artistSongs.forEach((sa) => {
        const artistPref = preferredArtists.find((a) => a.artistId === sa.artistId)
        const score = (artistPref?.weight || 0) * 10

        const existing = scores.get(sa.songId)
        if (existing) {
          existing.score += score
          existing.reasons.push('From artists you love')
        } else {
          scores.set(sa.songId, {
            songId: sa.songId,
            score,
            reasons: ['From artists you love'],
          })
        }
      })
    }

    return Array.from(scores.values())
  }

  private async getTrendingScores() {
    const trending = await this.recommendationRepo.getTrendingSongs(50)

    return trending.map((song) => ({
      songId: song.id,
      score: Math.log(Number(song.playCount) + 1) * 2,
      reasons: ['Trending now'],
    }))
  }

  private combineScores(strategies: Array<{ scores: RecommendationScore[]; weight: number }>): RecommendationScore[] {
    const combined: Map<number, RecommendationScore> = new Map()

    strategies.forEach(({ scores, weight }) => {
      scores.forEach((item) => {
        const existing = combined.get(item.songId)
        const weightedScore = item.score * weight

        if (existing) {
          existing.score += weightedScore
          existing.reasons.push(...item.reasons)
        } else {
          combined.set(item.songId, {
            songId: item.songId,
            score: weightedScore,
            reasons: [...item.reasons],
          })
        }
      })
    })

    return Array.from(combined.values()).sort((a, b) => b.score - a.score)
  }

  async getSimilarSongs(songId: number, limit: number = 10) {
    const song = await this.recommendationRepo.findSongById(songId)

    if (!song) return []

    const scores: Map<number, RecommendationScore> = new Map()

    if (song.genreId) {
      const genreSongs = await this.recommendationRepo.findSongsByGenre(song.genreId, songId, 30)

      genreSongs.forEach((s) => {
        scores.set(s.id, {
          songId: s.id,
          score: 5,
          reasons: ['Same genre'],
        })
      })
    }

    const artistIds = song.songArtists.map((sa) => sa.artistId)
    if (artistIds.length > 0) {
      const artistSongs = await this.recommendationRepo.findSongsByArtistIds(artistIds, songId, 30)

      artistSongs.forEach((sa) => {
        const existing = scores.get(sa.songId)
        if (existing) {
          existing.score += 8
          existing.reasons.push('Same artist')
        } else {
          scores.set(sa.songId, {
            songId: sa.songId,
            score: 8,
            reasons: ['Same artist'],
          })
        }
      })
    }

    if (song.albumId) {
      const albumSongs = await this.recommendationRepo.findSongsByAlbum(song.albumId, songId)

      albumSongs.forEach((s) => {
        const existing = scores.get(s.id)
        if (existing) {
          existing.score += 6
          existing.reasons.push('Same album')
        } else {
          scores.set(s.id, {
            songId: s.id,
            score: 6,
            reasons: ['Same album'],
          })
        }
      })
    }

    const recommendations = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return this.fetchSongDetails(recommendations)
  }

  private async getUserPreferredGenres(userId: number, listeningHistory: any[]) {
    const songIds = listeningHistory.map((h) => h.songId)

    if (songIds.length === 0) return []

    const genres = await this.recommendationRepo.getGenrePreferences(songIds)

    const total = songIds.length
    return genres
      .filter((g) => g.genreId !== null)
      .map((g) => ({
        genreId: g.genreId!,
        weight: g._count.id / total,
      }))
  }

  private async getUserPreferredArtists(userId: number, listeningHistory: any[], favorites: any[]) {
    const songIds = [...listeningHistory.map((h) => h.songId), ...favorites.map((f) => f.songId)]

    if (songIds.length === 0) return []

    const artists = await this.recommendationRepo.getArtistPreferences(songIds)

    const total = songIds.length
    return artists.map((a) => ({
      artistId: a.artistId,
      weight: a._count.songId / total,
    }))
  }

  private async fetchSongDetails(recommendations: RecommendationScore[]) {
    const songIds = recommendations.map((r) => r.songId)

    const songs = await this.songRepo.findSongs({ id: { in: songIds } }, 0, songIds.length, [])

    return recommendations.map((rec) => {
      const song = songs.find((s) => s.id === rec.songId)
      return {
        ...song,
        recommendationScore: rec.score,
        recommendationReasons: rec.reasons,
      }
    })
  }
}
