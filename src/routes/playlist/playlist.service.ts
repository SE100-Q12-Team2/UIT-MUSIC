import { Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { CreatePlaylistBodyType, GetAllPlaylistResType, GetPlaylistQueryType } from 'src/routes/playlist/playlist.model'
import { PlaylistRepository } from 'src/routes/playlist/playlist.repo'
import { SEARCH_SYNC_EVENTS } from 'src/shared/events/search-sync.events'

@Injectable()
export class PlaylistService {
  constructor(
    private readonly playlistRepository: PlaylistRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAllPlaylists(query: GetPlaylistQueryType): Promise<GetAllPlaylistResType> {
    return this.playlistRepository.findAll(query)
  }

  async getPlaylistById(id: number) {
    const playlist = await this.playlistRepository.findById(id)
    if (!playlist) {
      throw new NotFoundException('Playlist not found')
    }
    return playlist
  }

  async createPlaylist(body: CreatePlaylistBodyType) {
    const playlist = await this.playlistRepository.create(body)

    this.eventEmitter.emit(SEARCH_SYNC_EVENTS.PLAYLIST_CREATED, { playlistId: Number(playlist.id) })

    return playlist
  }

  async updatePlaylist(id: number, body: Partial<CreatePlaylistBodyType>) {
    const playlist = await this.playlistRepository.findById(id)
    if (!playlist) {
      throw new NotFoundException('Playlist not found')
    }
    const result = await this.playlistRepository.update(id, body)

    this.eventEmitter.emit(SEARCH_SYNC_EVENTS.PLAYLIST_UPDATED, { playlistId: id })

    return result
  }

  async deletePlaylist(id: number) {
    const playlist = await this.playlistRepository.findById(id)
    if (!playlist) {
      throw new NotFoundException('Playlist not found')
    }
    const result = await this.playlistRepository.delete(id)

    this.eventEmitter.emit(SEARCH_SYNC_EVENTS.PLAYLIST_DELETED, { playlistId: id })

    return result
  }
}
