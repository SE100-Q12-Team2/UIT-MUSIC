import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  MeilisearchService,
  SongDocument,
  AlbumDocument,
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

    await Promise.all([this.indexAllSongs(), this.indexAllAlbums()])

    console.log('✅ Full reindex completed!')
  }

  async indexAllSongs() {
    console.log('📀 Indexing songs...')

    const songs = await this.prisma.song.findMany({
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



  async updateSongIndex(songId: number) {
    const song = await this.prisma.song.findUnique({
      where: { id: songId },
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
    }

    await this.meili.indexSong(songDocument)
  }







}
