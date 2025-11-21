import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
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
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('Playlists')
@Controller('playlists')
@Auth([AuthType.None])
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  @ZodSerializerDto(GetAllPlaylistsDTO)
  @ApiOperation({
    summary: 'Get all playlists',
    description: 'Retrieve paginated list of playlists with optional filtering by owner, privacy, and tags',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'ownerId', required: false, type: String, description: 'Filter by playlist owner user ID' })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean, description: 'Filter by public/private playlists' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search by playlist name' })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['createdAt', 'playlistName', 'updatedAt'],
    description: 'Sort field',
  })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiResponse({ status: 200, description: 'Playlists retrieved successfully', type: GetAllPlaylistsDTO })
  getPlaylists(@Query() query: GetPlaylistQueryDTO) {
    return this.playlistService.getAllPlaylists(query)
  }

  @Get(':id')
  @ZodSerializerDto(GetPlaylistQueryDTO)
  @ApiOperation({
    summary: 'Get playlist by ID',
    description: 'Retrieve detailed information about a specific playlist including all tracks',
  })
  @ApiParam({ name: 'id', type: String, description: 'Playlist ID' })
  @ApiResponse({ status: 200, description: 'Playlist found', type: GetPlaylistQueryDTO })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  getPlayListById(@Param('id') id: string) {
    return this.playlistService.getPlaylistById(Number(id))
  }

  @Post()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(CreatePlaylistResDTO)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new playlist',
    description: 'Create a new playlist with name, description, and privacy settings',
  })
  @ApiResponse({ status: 201, description: 'Playlist created successfully', type: CreatePlaylistResDTO })
  @ApiResponse({ status: 400, description: 'Invalid playlist data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createPlaylist(@Body() body: CreatePlaylistBodyDTO) {
    return this.playlistService.createPlaylist(body)
  }

  @Put(':id')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(UpdatePlaylistResDTO)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update playlist',
    description: 'Update playlist information including name, description, cover image, and privacy settings',
  })
  @ApiParam({ name: 'id', type: String, description: 'Playlist ID' })
  @ApiResponse({ status: 200, description: 'Playlist updated successfully', type: UpdatePlaylistResDTO })
  @ApiResponse({ status: 400, description: 'Invalid playlist data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  updatePlaylist(@Param('id') id: string, @Body() body: UpdatePlaylistBodyDTO) {
    return this.playlistService.updatePlaylist(Number(id), body)
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(MessageResDTO)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete playlist',
    description: 'Delete a playlist and all its tracks',
  })
  @ApiParam({ name: 'id', type: String, description: 'Playlist ID' })
  @ApiResponse({ status: 200, description: 'Playlist deleted successfully', type: MessageResDTO })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  deletePlaylist(@Param('id') id: string) {
    return this.playlistService.deletePlaylist(Number(id))
  }
}
