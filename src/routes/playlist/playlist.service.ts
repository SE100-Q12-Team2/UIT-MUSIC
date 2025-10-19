import { Injectable } from '@nestjs/common'
import { GetAllPlaylistResType, GetPlaylistQueryType } from 'src/routes/playlist/playlist.model'
import { PlaylistRepository } from 'src/routes/playlist/playlist.repo'

@Injectable()
export class PlaylistService {
  constructor(private readonly playlistRepository: PlaylistRepository) {}

  async getAllPlaylists(query: GetPlaylistQueryType): Promise<GetAllPlaylistResType> {
    return this.playlistRepository.findAll(query)
  }

  async getPlaylistById(id: number) {
    return this.playlistRepository.findById(id)
  }
}
