import { Body, Controller, Delete, Get, Param, Post, Put, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
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
  private readonly logger = new Logger(PlaylistController.name)

  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetAllPlaylistsDTO)
  @ApiOperation({
    summary: 'Get all playlists',
    description: 'Retrieve paginated list of playlists with optional filtering by owner, privacy, tags, and search query. Public access available.',
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
  @ApiOkResponse({ 
    description: 'Playlists retrieved successfully', 
    type: GetAllPlaylistsDTO,
  })
  getPlaylists(@Query() query: GetPlaylistQueryDTO) {
    try {
      this.logger.log(`Get playlists request with filters: ${JSON.stringify(query)}`)
      return this.playlistService.getAllPlaylists(query)
    } catch (error) {
      this.logger.error('Failed to get playlists', error.stack)
      throw error
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetPlaylistQueryDTO)
  @ApiOperation({
    summary: 'Get playlist by ID',
    description: 'Retrieve detailed information about a specific playlist including all tracks, owner info, and track count.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Playlist ID' })
  @ApiOkResponse({ 
    description: 'Playlist found and retrieved successfully', 
    type: GetPlaylistQueryDTO,
  })
  @ApiNotFoundResponse({ 
    description: 'Playlist not found',
  })
  getPlayListById(@Param('id') id: string) {
    try {
      this.logger.log(`Get playlist by ID: ${id}`)
      return this.playlistService.getPlaylistById(Number(id))
    } catch (error) {
      this.logger.error(`Failed to get playlist by ID: ${id}`, error.stack)
      throw error
    }
  }

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CreatePlaylistResDTO)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new playlist',
    description: 'Create a new playlist with name, description, cover image, privacy settings, and tags. Requires authentication.',
  })
  @ApiBody({
    type: CreatePlaylistBodyDTO,
    description: 'Playlist information',
  })
  @ApiCreatedResponse({ 
    description: 'Playlist created successfully', 
    type: CreatePlaylistResDTO,
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid playlist data or validation failed',
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  createPlaylist(@Body() body: CreatePlaylistBodyDTO) {
    try {
      this.logger.log(`Create playlist: ${body.playlistName}`)
      const result = this.playlistService.createPlaylist(body)
      this.logger.log(`Playlist created successfully`)
      return result
    } catch (error) {
      this.logger.error('Failed to create playlist', error.stack)
      throw error
    }
  }

  @Put(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UpdatePlaylistResDTO)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update playlist',
    description: 'Update playlist information including name, description, cover image, privacy settings, and tags. Requires authentication and ownership.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Playlist ID to update' })
  @ApiBody({
    type: UpdatePlaylistBodyDTO,
    description: 'Updated playlist fields',
  })
  @ApiOkResponse({ 
    description: 'Playlist updated successfully', 
    type: UpdatePlaylistResDTO,
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid playlist data or validation failed',
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiNotFoundResponse({ 
    description: 'Playlist not found',
  })
  updatePlaylist(@Param('id') id: string, @Body() body: UpdatePlaylistBodyDTO) {
    try {
      this.logger.log(`Update playlist ID: ${id}`)
      const result = this.playlistService.updatePlaylist(Number(id), body)
      this.logger.log(`Playlist updated successfully ID: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update playlist ID: ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete playlist',
    description: 'Soft delete a playlist and all its track associations. Playlist will be marked as deleted. Requires authentication and ownership.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Playlist ID to delete' })
  @ApiOkResponse({ 
    description: 'Playlist deleted successfully', 
    type: MessageResDTO,
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiNotFoundResponse({ 
    description: 'Playlist not found',
  })
  deletePlaylist(@Param('id') id: string) {
    try {
      this.logger.log(`Delete playlist ID: ${id}`)
      const result = this.playlistService.deletePlaylist(Number(id))
      this.logger.log(`Playlist deleted successfully ID: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete playlist ID: ${id}`, error.stack)
      throw error
    }
  }
}
