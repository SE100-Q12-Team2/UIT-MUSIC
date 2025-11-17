// Search sync events constants
export const SEARCH_SYNC_EVENTS = {
  // Song events
  SONG_CREATED: 'search.song.created',
  SONG_UPDATED: 'search.song.updated',
  SONG_DELETED: 'search.song.deleted',

  // Album events
  ALBUM_CREATED: 'search.album.created',
  ALBUM_UPDATED: 'search.album.updated',
  ALBUM_DELETED: 'search.album.deleted',

  // Artist events
  ARTIST_CREATED: 'search.artist.created',
  ARTIST_UPDATED: 'search.artist.updated',
  ARTIST_DELETED: 'search.artist.deleted',

  // Playlist events
  PLAYLIST_CREATED: 'search.playlist.created',
  PLAYLIST_UPDATED: 'search.playlist.updated',
  PLAYLIST_DELETED: 'search.playlist.deleted',
} as const

export type SearchSyncEvent = (typeof SEARCH_SYNC_EVENTS)[keyof typeof SEARCH_SYNC_EVENTS]

export interface SongSyncPayload {
  songId: number
}

export interface AlbumSyncPayload {
  albumId: number
}

export interface ArtistSyncPayload {
  artistId: number
}

export interface PlaylistSyncPayload {
  playlistId: number
}
