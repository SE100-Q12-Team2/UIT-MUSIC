import { Injectable } from '@nestjs/common'
import { MeilisearchService } from 'src/shared/services/meilisearch.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { SearchQueryType } from 'src/routes/search/search.model'
import { SearchType } from 'src/shared/constants/search.constant'

@Injectable()
export class SearchMeilisearchService {
  constructor(
    private readonly meili: MeilisearchService,
    private readonly prisma: PrismaService,
  ) {}

  async search(searchQuery: SearchQueryType, userId?: number) {
    const { query, type, page = 1, limit = 20 } = searchQuery
    const skip = (page - 1) * limit

    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      return this.getEmptySearchResult()
    }

    switch (type) {
      case SearchType.SONGS:
        return {
          songs: await this.searchSongs(trimmedQuery, skip, limit, userId),
        }
      case SearchType.ALBUMS:
        return {
          albums: await this.searchAlbums(trimmedQuery, skip, limit),
        }
      case SearchType.ARTISTS:
        return {
          artists: { items: [], total: 0, page: 1, limit, totalPages: 0 },
        }
      case SearchType.PLAYLISTS:
        return {
          playlists: await this.searchPlaylists(trimmedQuery, skip, limit),
        }
      case SearchType.ALL:
      default:
        return this.searchAll(trimmedQuery, skip, limit, userId)
    }
  }

  private async searchAll(query: string, skip: number, limit: number, userId?: number) {
    const limitPerType = Math.ceil(limit / 4)

    const [songs, albums, playlists] = await Promise.all([
      this.searchSongs(query, 0, limitPerType, userId),
      this.searchAlbums(query, 0, limitPerType),
      this.searchPlaylists(query, 0, limitPerType),
    ])

    const artists = { items: [], total: 0, page: 1, limit: limitPerType, totalPages: 0 }
    return { songs, albums, artists, playlists }
  }

  private async searchSongs(query: string, skip: number, limit: number, userId?: number) {
    const result = await this.meili.searchSongs(query, { limit, offset: skip })

    const songIds = result.hits.map((hit) => hit.id)

    if (songIds.length === 0) {
      return {
        items: [],
        total: 0,
        page: Math.floor(skip / limit) + 1,
        limit,
        totalPages: 0,
      }
    }

    const songs = await this.prisma.song.findMany({
      where: { id: { in: songIds } },
      include: {
        contributors: {
          include: {
            label: {
              select: {
                id: true,
                labelName: true,
                hasPublicProfile: true,
                description: true,
              },
            },
          },
        },
        album: {
          select: {
            id: true,
            albumTitle: true,
            coverImage: true,
          },
        },
        genre: {
          select: {
            id: true,
            genreName: true,
          },
        },
      },
    })

    const sortedSongs = songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((song): song is NonNullable<typeof song> => song !== undefined)

    return {
      items: sortedSongs.map((song) => ({
        id: song.id,
        title: song.title,
        description: song.description,
        lyrics: song.lyrics,
        duration: song.duration,
        language: song.language,
        playCount: Number(song.playCount),
        uploadDate: song.uploadDate.getTime(),
        isActive: song.isActive,
        contributors: song.contributors.map((c) => ({
          labelId: c.label.id,
          labelName: c.label.labelName,
          role: c.role,
          hasPublicProfile: c.label.hasPublicProfile,
          description: c.label.description,
        })),
        albumTitle: song.album?.albumTitle || null,
        albumId: song.album?.id || null,
        genreName: song.genre?.genreName || null,
        genreId: song.genre?.id || null,
        coverImage: song.album?.coverImage || null,
      })),
      total: result.estimatedTotalHits || 0,
      page: Math.floor(skip / limit) + 1,
      limit,
      totalPages: Math.ceil((result.estimatedTotalHits || 0) / limit),
    }
  }

  private async searchAlbums(query: string, skip: number, limit: number) {
    const result = await this.meili.searchAlbums(query, { limit, offset: skip })

    const albumIds = result.hits.map((hit) => hit.id)

    if (albumIds.length === 0) {
      return {
        items: [],
        total: 0,
        page: Math.floor(skip / limit) + 1,
        limit,
        totalPages: 0,
      }
    }

    const albums = await this.prisma.album.findMany({
      where: { id: { in: albumIds } },
      include: {
        label: {
          select: {
            id: true,
            labelName: true,
          },
        },
        _count: {
          select: { songs: true },
        },
      },
    })

    return {
      items: albums,
      total: result.estimatedTotalHits || 0,
      page: Math.floor(skip / limit) + 1,
      limit,
      totalPages: Math.ceil((result.estimatedTotalHits || 0) / limit),
    }
  }



  private async searchPlaylists(query: string, skip: number, limit: number) {
    const result = await this.meili.searchPlaylists(query, { limit, offset: skip })

    const playlistIds = result.hits.map((hit) => hit.id)

    if (playlistIds.length === 0) {
      return {
        items: [],
        total: 0,
        page: Math.floor(skip / limit) + 1,
        limit,
        totalPages: 0,
      }
    }

    const playlists = await this.prisma.playlist.findMany({
      where: { id: { in: playlistIds } },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: { playlistSongs: true },
        },
      },
    })

    return {
      items: playlists,
      total: result.estimatedTotalHits || 0,
      page: Math.floor(skip / limit) + 1,
      limit,
      totalPages: Math.ceil((result.estimatedTotalHits || 0) / limit),
    }
  }

  async getSuggestions(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return { suggestions: [] }
    }

    const suggestions = await this.meili.getSuggestions(query, limit)
    return { suggestions }
  }

  async getTrendingSearches(limit: number = 10) {
    const trendingSongs = await this.prisma.song.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { playCount: 'desc' },
      select: {
        id: true,
        title: true,
      },
    })

    return {
      trending: trendingSongs.map((song) => ({
        id: song.id,
        text: song.title,
        type: 'song',
      })),
    }
  }

  private getEmptySearchResult() {
    return {
      songs: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      albums: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      artists: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      playlists: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
    }
  }
}
