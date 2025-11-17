import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  MeilisearchService,
  SongDocument,
  AlbumDocument,
  ArtistDocument,
  PlaylistDocument,
} from 'src/shared/services/meilisearch.service'

@Injectable()
export class SearchIndexService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meili: MeilisearchService,
  ) {}

  async indexAllData() {
    console.log('🔄 Starting full reindex...')

    await Promise.all([this.indexAllSongs(), this.indexAllAlbums(), this.indexAllArtists(), this.indexAllPlaylists()])

    console.log('✅ Full reindex completed!')
  }

  async indexAllSongs() {
    console.log('📀 Indexing songs...')

    const songs = await this.prisma.song.findMany({
      include: {
        songArtists: {
          include: {
            artist: {
              select: {
                id: true,
                artistName: true,
                profileImage: true,
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

    const songDocuments: SongDocument[] = songs.map((song) => ({
      id: song.id,
      title: song.title,
      description: song.description,
      lyrics: song.lyrics,
      duration: song.duration,
      language: song.language,
      playCount: Number(song.playCount),
      uploadDate: song.uploadDate.getTime(),
      isActive: song.isActive,
      artists: song.songArtists.map((sa) => sa.artist.artistName),
      artistIds: song.songArtists.map((sa) => sa.artist.id),
      albumTitle: song.album?.albumTitle || null,
      albumId: song.album?.id || null,
      genreName: song.genre?.genreName || null,
      genreId: song.genre?.id || null,
      coverImage: song.album?.coverImage || null,
      profileImages: song.songArtists.map((sa) => sa.artist.profileImage).filter((img): img is string => img !== null),
    }))

    const batchSize = 1000
    for (let i = 0; i < songDocuments.length; i += batchSize) {
      const batch = songDocuments.slice(i, i + batchSize)
      await this.meili.indexSongs(batch)
      console.log(`  Indexed ${Math.min(i + batchSize, songDocuments.length)}/${songDocuments.length} songs`)
    }

    console.log(`✅ Indexed ${songDocuments.length} songs`)
  }

  async indexAllAlbums() {
    console.log('💿 Indexing albums...')

    const albums = await this.prisma.album.findMany({
      include: {
        label: {
          select: {
            labelName: true,
          },
        },
        _count: {
          select: { songs: true },
        },
      },
    })

    const albumDocuments: AlbumDocument[] = albums.map((album) => ({
      id: album.id,
      albumTitle: album.albumTitle,
      albumDescription: album.albumDescription,
      coverImage: album.coverImage,
      releaseDate: album.releaseDate?.getTime() || null,
      labelName: album.label?.labelName || null,
      totalTracks: album._count.songs,
    }))

    await this.meili.indexAlbums(albumDocuments)
    console.log(`✅ Indexed ${albumDocuments.length} albums`)
  }

  async indexAllArtists() {
    console.log('🎤 Indexing artists...')

    const artists = await this.prisma.artist.findMany({
      include: {
        _count: {
          select: { songArtists: true },
        },
      },
    })

    const artistDocuments: ArtistDocument[] = artists.map((artist) => ({
      id: artist.id,
      artistName: artist.artistName,
      biography: artist.biography,
      profileImage: artist.profileImage,
      hasPublicProfile: artist.hasPublicProfile,
      songCount: artist._count.songArtists,
    }))

    await this.meili.indexArtists(artistDocuments)
    console.log(`✅ Indexed ${artistDocuments.length} artists`)
  }

  async indexAllPlaylists() {
    console.log('📝 Indexing playlists...')

    const playlists = await this.prisma.playlist.findMany({
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
        _count: {
          select: { playlistSongs: true },
        },
      },
    })

    const playlistDocuments: PlaylistDocument[] = playlists.map((playlist) => ({
      id: playlist.id,
      playlistName: playlist.playlistName,
      description: playlist.description,
      coverImageUrl: playlist.coverImageUrl,
      tags: playlist.tags,
      isPublic: playlist.isPublic,
      userName: playlist.user.fullName,
      trackCount: playlist._count.playlistSongs,
      updatedAt: playlist.updatedAt.getTime(),
    }))

    await this.meili.indexPlaylists(playlistDocuments)
    console.log(`✅ Indexed ${playlistDocuments.length} playlists`)
  }

  async updateSongIndex(songId: number) {
    const song = await this.prisma.song.findUnique({
      where: { id: songId },
      include: {
        songArtists: {
          include: {
            artist: {
              select: {
                id: true,
                artistName: true,
                profileImage: true,
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

    if (!song) {
      await this.meili.deleteSong(songId)
      return
    }

    const songDocument: SongDocument = {
      id: song.id,
      title: song.title,
      description: song.description,
      lyrics: song.lyrics,
      duration: song.duration,
      language: song.language,
      playCount: Number(song.playCount),
      uploadDate: song.uploadDate.getTime(),
      isActive: song.isActive,
      artists: song.songArtists.map((sa) => sa.artist.artistName),
      artistIds: song.songArtists.map((sa) => sa.artist.id),
      albumTitle: song.album?.albumTitle || null,
      albumId: song.album?.id || null,
      genreName: song.genre?.genreName || null,
      genreId: song.genre?.id || null,
      coverImage: song.album?.coverImage || null,
      profileImages: song.songArtists.map((sa) => sa.artist.profileImage).filter((img): img is string => img !== null),
    }

    await this.meili.indexSong(songDocument)
  }
}
