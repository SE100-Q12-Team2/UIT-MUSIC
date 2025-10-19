import { Controller, Get, Param, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { GetAllPlaylistsDTO, GetPlaylistQueryDTO } from 'src/routes/playlist/playlist.dto'
import { PlaylistService } from 'src/routes/playlist/playlist.service'

@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  @ZodSerializerDto(GetAllPlaylistsDTO)
  getPlaylists(@Query() query: GetPlaylistQueryDTO) {
    return this.playlistService.getAllPlaylists(query)
  }

  @Get(':id')
  getPlayListById(@Param() id: number) {
    return this.playlistService.getPlaylistById(id)
  }
}
