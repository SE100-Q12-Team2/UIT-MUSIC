import { Controller, Get, Post, Put, Delete, Query, Param, Body, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiBody } from '@nestjs/swagger'
import { AlbumService } from './album.service'
import {
  GetAlbumsQueryDto,
  CreateAlbumDto,
  UpdateAlbumDto,
  AlbumResponseDto,
  PaginatedAlbumsResponseDto,
} from './album.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { AccessTokenPayloadReturn } from 'src/shared/types/jwt.type'

@ApiTags('Albums')
@Controller('albums')
export class AlbumController {
  private readonly logger = new Logger(AlbumController.name)

  constructor(private readonly albumService: AlbumService) {}

  @Auth([AuthType.None])
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all albums',
    description:
      'Retrieve a paginated list of albums with optional filtering by label, search query, and sorting options. Supports public access without authentication.',
  })
  @ApiOkResponse({ description: 'Albums retrieved successfully', type: PaginatedAlbumsResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'labelId', required: false, type: Number, description: 'Filter by record label ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by album title' })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['latest', 'oldest', 'title', 'releaseDate'],
    description: 'Sort order',
  })
  async getAlbums(@Query() query: GetAlbumsQueryDto): Promise<PaginatedAlbumsResponseDto> {
    try {
      this.logger.log(`Get albums with query: ${JSON.stringify(query)}`)
      const result = await this.albumService.getAlbums(query)
      return result
    } catch (error) {
      this.logger.error('Failed to get albums', error.stack)
      throw error
    }
  }

  @Auth([AuthType.None])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get album by ID',
    description: 'Retrieve detailed information about a specific album, optionally including all songs. Public access without authentication.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Album ID' })
  @ApiQuery({ name: 'includeSongs', required: false, type: String, description: 'Include songs list (true/false)' })
  @ApiOkResponse({ description: 'Album found', type: AlbumResponseDto })
  @ApiNotFoundResponse({ description: 'Album not found' })
  async getAlbumById(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeSongs') includeSongs?: string,
  ): Promise<AlbumResponseDto> {
    try {
      this.logger.log(`Get album by ID: ${id}, includeSongs: ${includeSongs}`)
      const result = await this.albumService.getAlbumById(id, includeSongs === 'true')
      this.logger.log(`Album retrieved: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get album ${id}`, error.stack)
      throw error
    }
  }

  @Auth([AuthType.Bearer])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new album',
    description: 'Create a new album with title, cover image, release date, and label association. Requires authentication.',
  })
  @ApiBody({ type: CreateAlbumDto, description: 'Album creation data' })
  @ApiCreatedResponse({ description: 'Album created successfully', type: AlbumResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid album data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async createAlbum(@Body() body: CreateAlbumDto, @ActiveUser() user: AccessTokenPayloadReturn) {
    try {
      const result = await this.albumService.createAlbum(body, user.userId)
      this.logger.log(`Album created successfully: ${result.id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to create album`, error.stack)
      throw error
    }
  }

  @Auth([AuthType.Bearer])
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update album',
    description: 'Update album information including title, cover image, release date, and label. Requires authentication and ownership.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Album ID to update' })
  @ApiBody({ type: UpdateAlbumDto, description: 'Updated album fields' })
  @ApiOkResponse({ description: 'Album updated successfully', type: AlbumResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid album data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Album not found' })
  async updateAlbum(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAlbumDto,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ) {
    try {
      this.logger.log(`Update album ${id} by user ${user.userId}`)
      const result = await this.albumService.updateAlbum(id, body, user.userId)
      this.logger.log(`Album updated successfully: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update album ${id}`, error.stack)
      throw error
    }
  }

  @Auth([AuthType.Bearer])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete album',
    description: 'Soft delete an album and all its track associations. Album will be marked as deleted. Requires authentication and ownership.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Album ID to delete' })
  @ApiOkResponse({ description: 'Album deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Album not found' })
  async deleteAlbum(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: AccessTokenPayloadReturn) {
    try {
      this.logger.log(`Delete album ${id} by user ${user.userId}`)
      const result = await this.albumService.deleteAlbum(id, user.userId)
      this.logger.log(`Album deleted successfully: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete album ${id}`, error.stack)
      throw error
    }
  }

  @Auth([AuthType.None])
  @Get('label/:labelId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get albums by label',
    description: 'Retrieve all albums from a specific record label. Public access without authentication.',
  })
  @ApiParam({ name: 'labelId', type: Number, description: 'Record label ID' })
  @ApiOkResponse({ description: 'Albums retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Label not found' })
  async getAlbumsByLabel(@Param('labelId', ParseIntPipe) labelId: number) {
    try {
      this.logger.log(`Get albums by label: ${labelId}`)
      const result = await this.albumService.getAlbumsByLabel(labelId)
      this.logger.log(`Retrieved albums for label ${labelId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get albums for label ${labelId}`, error.stack)
      throw error
    }
  }
}
