import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod'
import { GetPlaylistTracksResDTO } from 'src/routes/playlist-track/playlist-track.dto'
import {
  AddTrackBodySchema,
  BulkAddTracksBodySchema,
  ListPlaylistTracksQuerySchema,
  ReorderTrackBodySchema,
} from 'src/routes/playlist-track/playlist-track.model'
import { PlaylistTracksService } from 'src/routes/playlist-track/playlist-track.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@Controller('playlists/:playlistId/tracks')
@Auth([AuthType.Bearer])
export class PlaylistTracksController {
  constructor(private readonly service: PlaylistTracksService) {}

  @Get()
  @ZodSerializerDto(GetPlaylistTracksResDTO)
  async list(
    @Param('playlistId') playlistId: string,
    @Query(new ZodValidationPipe(ListPlaylistTracksQuerySchema)) query,
  ) {
    return this.service.list(Number(playlistId), query)
  }

  @Post()
  async addOne(
    @ActiveUser() currentUserId: number,
    @Param('playlistId') playlistId: string,
    @Body(new ZodValidationPipe(AddTrackBodySchema)) body,
  ) {
    return this.service.addOne(Number(playlistId), body, currentUserId)
  }

  @Post(':bulk')
  async addBulk(
    @ActiveUser() currentUserId: number,
    @Param('playlistId') playlistId: string,
    @Body(new ZodValidationPipe(BulkAddTracksBodySchema)) body,
  ) {
    return this.service.addBulk(Number(playlistId), body, currentUserId)
  }

  @Patch(':trackId/reorder')
  async reorder(
    @ActiveUser() currentUserId: number,
    @Param('playlistId') playlistId: string,
    @Param('trackId') trackId: string,
    @Body(new ZodValidationPipe(ReorderTrackBodySchema)) body,
  ) {
    return this.service.reorder(Number(playlistId), Number(trackId), body, currentUserId)
  }

  @Delete(':trackId')
  @ZodSerializerDto(MessageResDTO)
  async remove(
    @ActiveUser() currentUserId: number,
    @Param('playlistId') playlistId: string,
    @Param('trackId') trackId: string,
  ) {
    return this.service.remove(Number(playlistId), Number(trackId), currentUserId)
  }
}
