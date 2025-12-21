import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { SearchIndexService } from 'src/routes/search/search-index.service'
import { MeilisearchService } from 'src/shared/services/meilisearch.service'
import {
  SEARCH_SYNC_EVENTS,
  SongSyncPayload,
  AlbumSyncPayload,
  ArtistSyncPayload,
  PlaylistSyncPayload,
} from 'src/shared/events/search-sync.events'

@Injectable()
export class SearchSyncListener {
  private readonly logger = new Logger(SearchSyncListener.name)

  constructor(
    private readonly searchIndex: SearchIndexService,
    private readonly meilisearch: MeilisearchService,
  ) {}

  // ============ SONG EVENTS ============

  @OnEvent(SEARCH_SYNC_EVENTS.SONG_CREATED)
  async handleSongCreated(payload: SongSyncPayload) {
    try {
      this.logger.log(`Indexing new song: ${payload.songId}`)
      await this.searchIndex.updateSongIndex(payload.songId)
      this.logger.log(`Successfully indexed song: ${payload.songId}`)
    } catch (error) {
      this.logger.error(`Failed to index song ${payload.songId}:`, error)
      // Don't throw - indexing failures shouldn't break the main flow
    }
  }

  @OnEvent(SEARCH_SYNC_EVENTS.SONG_UPDATED)
  async handleSongUpdated(payload: SongSyncPayload) {
    try {
      this.logger.log(`Re-indexing updated song: ${payload.songId}`)
      await this.searchIndex.updateSongIndex(payload.songId)
      this.logger.log(`Successfully re-indexed song: ${payload.songId}`)
    } catch (error) {
      this.logger.error(`Failed to re-index song ${payload.songId}:`, error)
    }
  }

  @OnEvent(SEARCH_SYNC_EVENTS.SONG_DELETED)
  async handleSongDeleted(payload: SongSyncPayload) {
    try {
      this.logger.log(`Removing song from index: ${payload.songId}`)
      await this.meilisearch.deleteSong(payload.songId)
      this.logger.log(`Successfully removed song: ${payload.songId}`)
    } catch (error) {
      this.logger.error(`Failed to remove song ${payload.songId}:`, error)
    }
  }

  // ============ ALBUM EVENTS ============

  @OnEvent(SEARCH_SYNC_EVENTS.ALBUM_CREATED)
  async handleAlbumCreated(payload: AlbumSyncPayload) {
    try {
      this.logger.log(`Indexing new album: ${payload.albumId}`)
      const album = await this.searchIndex['prisma'].album.findUnique({
        where: { id: payload.albumId },
        include: {
          label: { select: { labelName: true } },
          _count: { select: { songs: true } },
        },
      })
      if (!album) return await this.meilisearch.deleteAlbum(payload.albumId)
      const doc = {
        id: album.id,
        albumTitle: album.albumTitle,
        albumDescription: album.albumDescription,
        coverImage: album.coverImage,
        releaseDate: album.releaseDate?.getTime() || null,
        labelName: album.label?.labelName || null,
        totalTracks: album._count.songs,
      }
      await this.meilisearch.indexAlbum(doc)
      this.logger.log(`Successfully indexed album: ${payload.albumId}`)
    } catch (error) {
      this.logger.error(`Failed to index album ${payload.albumId}:`, error)
    }
  }

  @OnEvent(SEARCH_SYNC_EVENTS.ALBUM_UPDATED)
  async handleAlbumUpdated(payload: AlbumSyncPayload) {
    await this.handleAlbumCreated(payload)
  }

  @OnEvent(SEARCH_SYNC_EVENTS.ALBUM_DELETED)
  async handleAlbumDeleted(payload: AlbumSyncPayload) {
    try {
      this.logger.log(`Removing album from index: ${payload.albumId}`)
      await this.meilisearch.deleteAlbum(payload.albumId)
      this.logger.log(`Successfully removed album: ${payload.albumId}`)
    } catch (error) {
      this.logger.error(`Failed to remove album ${payload.albumId}:`, error)
    }
  }

  // ============ ARTIST EVENTS ============

  @OnEvent(SEARCH_SYNC_EVENTS.ARTIST_CREATED)
  async handleArtistCreated(payload: ArtistSyncPayload) {
    try {
      this.logger.log(`Indexing new record label: ${payload.artistId}`)
      const label = await this.searchIndex['prisma'].recordLabel.findUnique({
        where: { id: payload.artistId },
        include: {
          user: { select: { fullName: true, profileImage: true } },
          songs: { select: { id: true } },
        },
      })
      if (!label) return await this.meilisearch.deleteArtist(payload.artistId)
      const doc = {
        id: label.id,
        artistName: label.labelName,
        biography: label.description,
        profileImage: label.user?.profileImage || null,
        hasPublicProfile: label.hasPublicProfile,
        songCount: label.songs.length,
      }
      await this.meilisearch.indexArtist(doc)
      this.logger.log(`Successfully indexed record label: ${payload.artistId}`)
    } catch (error) {
      this.logger.error(`Failed to index record label ${payload.artistId}:`, error)
    }
  }

  @OnEvent(SEARCH_SYNC_EVENTS.ARTIST_UPDATED)
  async handleArtistUpdated(payload: ArtistSyncPayload) {
    await this.handleArtistCreated(payload)
  }

  @OnEvent(SEARCH_SYNC_EVENTS.ARTIST_DELETED)
  async handleArtistDeleted(payload: ArtistSyncPayload) {
    try {
      this.logger.log(`Removing artist from index: ${payload.artistId}`)
      await this.meilisearch.deleteArtist(payload.artistId)
      this.logger.log(`Successfully removed artist: ${payload.artistId}`)
    } catch (error) {
      this.logger.error(`Failed to remove artist ${payload.artistId}:`, error)
    }
  }

  // ============ PLAYLIST EVENTS ============

  @OnEvent(SEARCH_SYNC_EVENTS.PLAYLIST_CREATED)
  async handlePlaylistCreated(payload: PlaylistSyncPayload) {
    try {
      this.logger.log(`Indexing new playlist: ${payload.playlistId}`)
      const playlist = await this.searchIndex['prisma'].playlist.findUnique({
        where: { id: payload.playlistId },
        include: {
          user: { select: { fullName: true } },
          _count: { select: { playlistSongs: true } },
        },
      })
      if (!playlist) return await this.meilisearch.deletePlaylist(payload.playlistId)
      const doc = {
        id: playlist.id,
        playlistName: playlist.playlistName,
        description: playlist.description,
        coverImageUrl: playlist.coverImageUrl,
        tags: playlist.tags,
        isPublic: playlist.isPublic,
        userName: playlist.user?.fullName || '',
        trackCount: playlist._count.playlistSongs,
        updatedAt: playlist.updatedAt.getTime(),
      }
      await this.meilisearch.indexPlaylist(doc)
      this.logger.log(`Successfully indexed playlist: ${payload.playlistId}`)
    } catch (error) {
      this.logger.error(`Failed to index playlist ${payload.playlistId}:`, error)
    }
  }

  @OnEvent(SEARCH_SYNC_EVENTS.PLAYLIST_UPDATED)
  async handlePlaylistUpdated(payload: PlaylistSyncPayload) {
    await this.handlePlaylistCreated(payload)
  }

  @OnEvent(SEARCH_SYNC_EVENTS.PLAYLIST_DELETED)
  async handlePlaylistDeleted(payload: PlaylistSyncPayload) {
    try {
      this.logger.log(`Removing playlist from index: ${payload.playlistId}`)
      await this.meilisearch.deletePlaylist(payload.playlistId)
      this.logger.log(`Successfully removed playlist: ${payload.playlistId}`)
    } catch (error) {
      this.logger.error(`Failed to remove playlist ${payload.playlistId}:`, error)
    }
  }
}
