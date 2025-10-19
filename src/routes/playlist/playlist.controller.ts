import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreatePlaylistBodyDTO,
  CreatePlaylistResDTO,
  GetAllPlaylistsDTO,
  GetPlaylistQueryDTO,
  UpdatePlaylistBodyDTO,
  UpdatePlaylistResDTO,
} from 'src/routes/playlist/playlist.dto'
import { PlaylistService } from 'src/routes/playlist/playlist.service'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  @ZodSerializerDto(GetAllPlaylistsDTO)
  getPlaylists(@Query() query: GetPlaylistQueryDTO) {
    return this.playlistService.getAllPlaylists(query)
  }

  @Get(':id')
  @ZodSerializerDto(GetPlaylistQueryDTO)
  getPlayListById(@Param('id') id: string) {
    return this.playlistService.getPlaylistById(Number(id))
  }

  @Post()
  @ZodSerializerDto(CreatePlaylistResDTO)
  createPlaylist(@Body() body: CreatePlaylistBodyDTO) {
    return this.playlistService.createPlaylist(body)
  }

  @Put(':id')
  @ZodSerializerDto(UpdatePlaylistResDTO)
  updatePlaylist(@Param('id') id: string, @Body() body: UpdatePlaylistBodyDTO) {
    return this.playlistService.updatePlaylist(Number(id), body)
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  deletePlaylist(@Param('id') id: string) {
    return this.playlistService.deletePlaylist(Number(id))
  }
}
