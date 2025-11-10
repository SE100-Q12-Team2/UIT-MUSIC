import { Injectable } from '@nestjs/common'
import { SearchRepository } from './search.repo'
import { Prisma } from '@prisma/client'
import { SearchQueryType } from 'src/routes/search/search.model'
import { SearchType } from 'src/shared/constants/search.constant'

@Injectable()
export class SearchService {
  constructor(private readonly searchRepo: SearchRepository) {}

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
          artists: await this.searchArtists(trimmedQuery, skip, limit),
        }
      case SearchType.PLAYLISTS:
        return {
          playlists: await this.searchPlaylists(trimmedQuery, skip, limit, userId),
        }
      case SearchType.USERS:
        return {
          users: await this.searchUsers(trimmedQuery, skip, limit),
        }
      case SearchType.ALL:
      default:
        return this.searchAll(trimmedQuery, skip, limit, userId)
    }
  }

  private async searchAll(query: string, skip: number, limit: number, userId?: number) {
    const limitPerType = Math.ceil(limit / 4)

    const [songs, albums, artists, playlists] = await Promise.all([
      this.searchSongs(query, 0, limitPerType, userId),
      this.searchAlbums(query, 0, limitPerType),
      this.searchArtists(query, 0, limitPerType),
      this.searchPlaylists(query, 0, limitPerType, userId),
    ])

    return {
      songs,
      albums,
      artists,
      playlists,
    }
  }

  private async searchSongs(query: string, skip: number, limit: number, userId?: number) {
    console.log('Searching songs with query:', query)

    const searchConditions: Prisma.SongWhereInput = {
      isActive: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { lyrics: { contains: query, mode: 'insensitive' } },
        {
          songArtists: {
            some: {
              artist: {
                artistName: { contains: query, mode: 'insensitive' },
              },
            },
          },
        },
        {
          album: {
            albumTitle: { contains: query, mode: 'insensitive' },
          },
        },
      ],
    }

    const [songs, total] = await Promise.all([
      this.searchRepo.findSongs(searchConditions, skip, limit, userId),
      this.searchRepo.countSongs(searchConditions),
    ])

    return {
      items: songs.map((song) => ({
        ...song,
        isFavorite: userId ? song.favorites?.length > 0 : false,
        favorites: undefined,
      })),
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  private async searchAlbums(query: string, skip: number, limit: number) {
    const searchConditions: Prisma.AlbumWhereInput = {
      OR: [
        { albumTitle: { contains: query, mode: 'insensitive' } },
        { albumDescription: { contains: query, mode: 'insensitive' } },
      ],
    }

    const [albums, total] = await Promise.all([
      this.searchRepo.findAlbums(searchConditions, skip, limit),
      this.searchRepo.countAlbums(searchConditions),
    ])

    return {
      items: albums,
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  private async searchArtists(query: string, skip: number, limit: number) {
    const searchConditions: Prisma.ArtistWhereInput = {
      hasPublicProfile: true,
      OR: [
        { artistName: { contains: query, mode: 'insensitive' } },
        { biography: { contains: query, mode: 'insensitive' } },
      ],
    }

    const [artists, total] = await Promise.all([
      this.searchRepo.findArtists(searchConditions, skip, limit),
      this.searchRepo.countArtists(searchConditions),
    ])

    const artistsWithFollowers = await Promise.all(
      artists.map(async (artist) => {
        const followerCount = await this.searchRepo.countFollowers('Artist', artist.id)
        return {
          ...artist,
          followerCount,
        }
      }),
    )

    return {
      items: artistsWithFollowers,
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  private async searchPlaylists(query: string, skip: number, limit: number, userId?: number) {
    const searchConditions: Prisma.PlaylistWhereInput = {
      isPublic: true,
      OR: [
        { playlistName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
    }

    const [playlists, total] = await Promise.all([
      this.searchRepo.findPlaylists(searchConditions, skip, limit),
      this.searchRepo.countPlaylists(searchConditions),
    ])

    return {
      items: playlists,
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  private async searchUsers(query: string, skip: number, limit: number) {
    const searchConditions: Prisma.UserWhereInput = {
      accountStatus: 'Active',
      deletedAt: null,
      OR: [{ fullName: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } }],
    }

    const [users, total] = await Promise.all([
      this.searchRepo.findUsers(searchConditions, skip, limit),
      this.searchRepo.countUsers(searchConditions),
    ])

    return {
      items: users,
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getSuggestions(query: string, limit: number = 10) {
    const searchQuery = query.trim()
    if (!searchQuery || searchQuery.length < 2) {
      return {
        suggestions: [],
      }
    }

    const [songs, artists, albums] = await Promise.all([
      this.searchRepo.findSongSuggestions(searchQuery, Math.ceil(limit / 3)),
      this.searchRepo.findArtistSuggestions(searchQuery, Math.ceil(limit / 3)),
      this.searchRepo.findAlbumSuggestions(searchQuery, Math.ceil(limit / 3)),
    ])

    const suggestions = [
      ...songs.map((s) => ({ type: 'song', id: s.id, text: s.title })),
      ...artists.map((a) => ({ type: 'artist', id: a.id, text: a.artistName })),
      ...albums.map((a) => ({ type: 'album', id: a.id, text: a.albumTitle })),
    ].slice(0, limit)

    return {
      suggestions,
    }
  }

  async getTrendingSearches(limit: number = 10) {
    const trendingSongs = await this.searchRepo.findTrendingSongs(limit)

    return {
      trending: trendingSongs.map((song) => ({
        id: song.id,
        text: song.title,
        type: 'song',
        artists: song.songArtists.map((sa) => sa.artist.artistName),
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
