import { Injectable, OnModuleInit } from '@nestjs/common'
import { MeiliSearch, Index } from 'meilisearch'
import envConfig from 'src/shared/config'

export interface ContributorDocument {
  labelId: number;
  labelName: string;
  role: string;
  hasPublicProfile: boolean;
  description: string | null;
}

export interface SongDocument {
  id: number;
  title: string;
  description: string | null;
  lyrics: string | null;
  duration: number;
  language: string | null;
  playCount: number;
  uploadDate: number;
  isActive: boolean;
  contributors: ContributorDocument[];
  albumTitle: string | null;
  albumId: number | null;
  genreName: string | null;
  genreId: number | null;
  coverImage: string | null;
}

export interface AlbumDocument {
  id: number
  albumTitle: string
  albumDescription: string | null
  coverImage: string | null
  releaseDate: number | null 
  labelName: string | null
  totalTracks: number
}

export interface ArtistDocument {
  id: number
  artistName: string
  biography: string | null
  profileImage: string | null
  hasPublicProfile: boolean
  songCount: number
}

export interface PlaylistDocument {
  id: number
  playlistName: string
  description: string | null
  coverImageUrl: string | null
  tags: string[]
  isPublic: boolean
  userName: string
  trackCount: number
  updatedAt: number  
}

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: MeiliSearch
  private songsIndex: Index<SongDocument>
  private albumsIndex: Index<AlbumDocument>
  private artistsIndex: Index<ArtistDocument>
  private playlistsIndex: Index<PlaylistDocument>

  constructor() {
    this.client = new MeiliSearch({
      host: envConfig.MEILI_HOST || 'http://localhost:7700',
      apiKey: envConfig.MEILI_MASTER_KEY,
    })
  }

  async onModuleInit() {
    this.songsIndex = this.client.index<SongDocument>('songs')
    this.albumsIndex = this.client.index<AlbumDocument>('albums')
    this.artistsIndex = this.client.index<ArtistDocument>('artists')
    this.playlistsIndex = this.client.index<PlaylistDocument>('playlists')

    await this.configureSongsIndex()
    await this.configureAlbumsIndex()
    await this.configureArtistsIndex()
    await this.configurePlaylistsIndex()

    console.log('✅ Meilisearch indexes configured')
  }

  private async configureSongsIndex() {
    await this.songsIndex.updateSettings({
      searchableAttributes: ['title', 'artists', 'albumTitle', 'genreName', 'description', 'lyrics', 'language'],
      filterableAttributes: ['isActive', 'genreId', 'artistIds', 'albumId', 'language'],
      sortableAttributes: ['playCount', 'uploadDate', 'duration'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness', 'playCount:desc'],
      displayedAttributes: ['*'],
    })
  }

  private async configureAlbumsIndex() {
    await this.albumsIndex.updateSettings({
      searchableAttributes: ['albumTitle', 'albumDescription', 'labelName'],
      filterableAttributes: ['releaseDate'],
      sortableAttributes: ['releaseDate', 'totalTracks'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    })
  }

  private async configureArtistsIndex() {
    await this.artistsIndex.updateSettings({
      searchableAttributes: ['artistName', 'biography'],
      filterableAttributes: ['hasPublicProfile'],
      sortableAttributes: ['songCount'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness', 'songCount:desc'],
    })
  }

  private async configurePlaylistsIndex() {
    await this.playlistsIndex.updateSettings({
      searchableAttributes: ['playlistName', 'description', 'tags', 'userName'],
      filterableAttributes: ['isPublic', 'tags'],
      sortableAttributes: ['updatedAt', 'trackCount'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    })
  }

  // =============== INDEXING METHODS ===============

  async indexSong(song: SongDocument) {
    await this.songsIndex.addDocuments([song])
  }

  async indexSongs(songs: SongDocument[]) {
    if (songs.length === 0) return
    await this.songsIndex.addDocuments(songs, { primaryKey: 'id' })
  }

  async updateSong(songId: number, updates: Partial<SongDocument>) {
    await this.songsIndex.updateDocuments([{ id: songId, ...updates }])
  }

  async deleteSong(songId: number) {
    await this.songsIndex.deleteDocument(songId)
  }

  async indexAlbum(album: AlbumDocument) {
    await this.albumsIndex.addDocuments([album])
  }

  async indexAlbums(albums: AlbumDocument[]) {
    if (albums.length === 0) return
    await this.albumsIndex.addDocuments(albums, { primaryKey: 'id' })
  }

  async deleteAlbum(albumId: number) {
    await this.albumsIndex.deleteDocument(albumId)
  }

  async indexArtist(artist: ArtistDocument) {
    await this.artistsIndex.addDocuments([artist])
  }

  async indexArtists(artists: ArtistDocument[]) {
    if (artists.length === 0) return
    await this.artistsIndex.addDocuments(artists, { primaryKey: 'id' })
  }

  async deleteArtist(artistId: number) {
    await this.artistsIndex.deleteDocument(artistId)
  }

  async indexPlaylist(playlist: PlaylistDocument) {
    await this.playlistsIndex.addDocuments([playlist])
  }

  async indexPlaylists(playlists: PlaylistDocument[]) {
    if (playlists.length === 0) return
    await this.playlistsIndex.addDocuments(playlists, { primaryKey: 'id' })
  }

  async deletePlaylist(playlistId: number) {
    await this.playlistsIndex.deleteDocument(playlistId)
  }

  // =============== SEARCH METHODS ===============

  async searchSongs(query: string, options?: { limit?: number; offset?: number; filters?: string }) {
    return this.songsIndex.search(query, {
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      filter: options?.filters ? [options.filters, 'isActive = true'] : ['isActive = true'],
      sort: ['playCount:desc'],
    })
  }

  async searchAlbums(query: string, options?: { limit?: number; offset?: number }) {
    return this.albumsIndex.search(query, {
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      sort: ['releaseDate:desc'],
    })
  }

  async searchArtists(query: string, options?: { limit?: number; offset?: number }) {
    return this.artistsIndex.search(query, {
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      filter: ['hasPublicProfile = true'],
      sort: ['songCount:desc'],
    })
  }

  async searchPlaylists(query: string, options?: { limit?: number; offset?: number }) {
    return this.playlistsIndex.search(query, {
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      filter: ['isPublic = true'],
      sort: ['updatedAt:desc'],
    })
  }

  async searchAll(query: string, limit: number = 20) {
    const limitPerType = Math.ceil(limit / 4)

    const [songs, albums, artists, playlists] = await Promise.all([
      this.searchSongs(query, { limit: limitPerType }),
      this.searchAlbums(query, { limit: limitPerType }),
      this.searchArtists(query, { limit: limitPerType }),
      this.searchPlaylists(query, { limit: limitPerType }),
    ])

    return {
      songs: songs.hits,
      albums: albums.hits,
      artists: artists.hits,
      playlists: playlists.hits,
    }
  }

  // =============== SUGGESTIONS ===============

  async getSuggestions(query: string, limit: number = 10) {
    if (!query || query.length < 2) return []

    const limitPerType = Math.ceil(limit / 3)

    const [songs, artists, albums] = await Promise.all([
      this.songsIndex.search(query, { limit: limitPerType, attributesToRetrieve: ['id', 'title'] }),
      this.artistsIndex.search(query, {
        limit: limitPerType,
        attributesToRetrieve: ['id', 'artistName'],
      }),
      this.albumsIndex.search(query, { limit: limitPerType, attributesToRetrieve: ['id', 'albumTitle'] }),
    ])

    return [
      ...songs.hits.map((s) => ({ type: 'song', id: s.id, text: s.title })),
      ...artists.hits.map((a) => ({ type: 'artist', id: a.id, text: a.artistName })),
      ...albums.hits.map((a) => ({ type: 'album', id: a.id, text: a.albumTitle })),
    ].slice(0, limit)
  }

  // =============== ADMIN ===============

  async clearAllIndexes() {
    await Promise.all([
      this.songsIndex.deleteAllDocuments(),
      this.albumsIndex.deleteAllDocuments(),
      this.artistsIndex.deleteAllDocuments(),
      this.playlistsIndex.deleteAllDocuments(),
    ])
  }

  async getStats() {
    const [songsStats, albumsStats, artistsStats, playlistsStats] = await Promise.all([
      this.songsIndex.getStats(),
      this.albumsIndex.getStats(),
      this.artistsIndex.getStats(),
      this.playlistsIndex.getStats(),
    ])

    return {
      songs: songsStats,
      albums: albumsStats,
      artists: artistsStats,
      playlists: playlistsStats,
    }
  }
}
