import { Injectable, NotFoundException } from '@nestjs/common'
import { CreatePlaylistBodyType, GetAllPlaylistResType, GetPlaylistQueryType } from 'src/routes/playlist/playlist.model'
import { PlaylistRepository } from 'src/routes/playlist/playlist.repo'

@Injectable()
export class PlaylistService {
  constructor(private readonly playlistRepository: PlaylistRepository) {}

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
    return this.playlistRepository.create(body)
  }

  async updatePlaylist(id: number, body: Partial<CreatePlaylistBodyType>) {
    const playlist = await this.playlistRepository.findById(id)
    if (!playlist) {
      throw new NotFoundException('Playlist not found')
    }
    return await this.playlistRepository.update(id, body)
  }

  async deletePlaylist(id: number) {
    const playlist = await this.playlistRepository.findById(id)
    if (!playlist) {
      throw new NotFoundException('Playlist not found')
    }
    return await this.playlistRepository.delete(id)
  }
}
