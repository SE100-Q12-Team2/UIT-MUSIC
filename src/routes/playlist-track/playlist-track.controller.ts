import { Body, Controller, Delete, Get, Param, Patch, Post, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger'
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

@ApiTags('Playlist Tracks')
@Controller('playlists/:playlistId/tracks')
@Auth([AuthType.Bearer])
export class PlaylistTracksController {
  private readonly logger = new Logger(PlaylistTracksController.name)

  constructor(private readonly service: PlaylistTracksService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(GetPlaylistTracksResDTO)
  @ApiOperation({ summary: 'Get playlist tracks', description: 'Retrieve all tracks in a playlist with position ordering. Requires authentication.' })
  @ApiParam({ name: 'playlistId', type: String, description: 'Playlist ID' })
  @ApiOkResponse({ description: 'Tracks retrieved successfully', type: GetPlaylistTracksResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Playlist not found' })
  async list(
    @Param('playlistId') playlistId: string,
    @Query(new ZodValidationPipe(ListPlaylistTracksQuerySchema)) query,
  ) {
    try {
      this.logger.log(`Get tracks for playlist ${playlistId}`)
      return await this.service.list(Number(playlistId), query)
    } catch (error) {
      this.logger.error(`Failed to get tracks for playlist ${playlistId}`, error.stack)
      throw error
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add track to playlist', description: 'Add a single song to playlist. Requires authentication and ownership.' })
  @ApiParam({ name: 'playlistId', type: String, description: 'Playlist ID' })
  @ApiCreatedResponse({ description: 'Track added successfully' })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async addOne(
    @ActiveUser() currentUserId: number,
    @Param('playlistId') playlistId: string,
    @Body(new ZodValidationPipe(AddTrackBodySchema)) body,
  ) {
    try {
      this.logger.log(`Add track to playlist ${playlistId} by user ${currentUserId}`)
      return await this.service.addOne(Number(playlistId), body, currentUserId)
    } catch (error) {
      this.logger.error(`Failed to add track to playlist ${playlistId}`, error.stack)
      throw error
    }
  }

  @Post(':bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add multiple tracks', description: 'Add multiple songs to playlist at once. Requires authentication and ownership.' })
  @ApiParam({ name: 'playlistId', type: String, description: 'Playlist ID' })
  @ApiCreatedResponse({ description: 'Tracks added successfully' })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async addBulk(
    @ActiveUser() currentUserId: number,
    @Param('playlistId') playlistId: string,
    @Body(new ZodValidationPipe(BulkAddTracksBodySchema)) body,
  ) {
    try {
      this.logger.log(`Bulk add tracks to playlist ${playlistId} by user ${currentUserId}`)
      return await this.service.addBulk(Number(playlistId), body, currentUserId)
    } catch (error) {
      this.logger.error(`Failed to bulk add tracks to playlist ${playlistId}`, error.stack)
      throw error
    }
  }

  @Patch(':trackId/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reorder track', description: 'Change the position of a track in the playlist. Requires authentication and ownership.' })
  @ApiParam({ name: 'playlistId', type: String, description: 'Playlist ID' })
  @ApiParam({ name: 'trackId', type: String, description: 'Track ID' })
  @ApiOkResponse({ description: 'Track reordered successfully' })
  @ApiBadRequestResponse({ description: 'Invalid position' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Track not found' })
  async reorder(
    @ActiveUser() currentUserId: number,
    @Param('playlistId') playlistId: string,
    @Param('trackId') trackId: string,
    @Body(new ZodValidationPipe(ReorderTrackBodySchema)) body,
  ) {
    try {
      this.logger.log(`Reorder track ${trackId} in playlist ${playlistId}`)
      return await this.service.reorder(Number(playlistId), Number(trackId), body, currentUserId)
    } catch (error) {
      this.logger.error(`Failed to reorder track ${trackId}`, error.stack)
      throw error
    }
  }

  @Delete(':trackId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({ summary: 'Remove track from playlist', description: 'Remove a song from playlist. Requires authentication and ownership.' })
  @ApiParam({ name: 'playlistId', type: String, description: 'Playlist ID' })
  @ApiParam({ name: 'trackId', type: String, description: 'Track ID' })
  @ApiOkResponse({ description: 'Track removed successfully', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Track not found' })
  async remove(
    @ActiveUser() currentUserId: number,
    @Param('playlistId') playlistId: string,
    @Param('trackId') trackId: string,
  ) {
    try {
      this.logger.log(`Remove track ${trackId} from playlist ${playlistId}`)
      return await this.service.remove(Number(playlistId), Number(trackId), currentUserId)
    } catch (error) {
      this.logger.error(`Failed to remove track ${trackId}`, error.stack)
      throw error
    }
  }
}
