import { Controller, Get, Post, Put, Delete, Query, Param, Body, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
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
  constructor(private readonly albumService: AlbumService) {}

  @Auth([AuthType.None])
  @Get()
  @ApiOperation({
    summary: 'Get all albums',
    description:
      'Retrieve a paginated list of albums with optional filtering by label, search query, and sorting options',
  })
  @ApiResponse({ status: 200, description: 'Albums retrieved successfully', type: PaginatedAlbumsResponseDto })
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
    return this.albumService.getAlbums(query)
  }

  @Auth([AuthType.None])
  @Get(':id')
  @ApiOperation({
    summary: 'Get album by ID',
    description: 'Retrieve detailed information about a specific album, optionally including all songs',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Album ID' })
  @ApiQuery({ name: 'includeSongs', required: false, type: String, description: 'Include songs list (true/false)' })
  @ApiResponse({ status: 200, description: 'Album found', type: AlbumResponseDto })
  @ApiResponse({ status: 404, description: 'Album not found' })
  async getAlbumById(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeSongs') includeSongs?: string,
  ): Promise<AlbumResponseDto> {
    return this.albumService.getAlbumById(id, includeSongs === 'true')
  }

  @Auth([AuthType.Bearer])
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new album',
    description: 'Create a new album (requires authentication)',
  })
  @ApiResponse({ status: 201, description: 'Album created successfully', type: AlbumResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid album data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createAlbum(@Body() body: CreateAlbumDto, @ActiveUser() user: AccessTokenPayloadReturn) {
    return this.albumService.createAlbum(body, user.userId)
  }

  @Auth([AuthType.Bearer])
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update album',
    description: 'Update album information (requires authentication)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Album ID' })
  @ApiResponse({ status: 200, description: 'Album updated successfully', type: AlbumResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid album data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Album not found' })
  async updateAlbum(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAlbumDto,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ) {
    return this.albumService.updateAlbum(id, body, user.userId)
  }

  @Auth([AuthType.Bearer])
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete album',
    description: 'Delete an album (requires authentication)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Album ID' })
  @ApiResponse({ status: 200, description: 'Album deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Album not found' })
  async deleteAlbum(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: AccessTokenPayloadReturn) {
    return this.albumService.deleteAlbum(id, user.userId)
  }

  @Auth([AuthType.None])
  @Get('label/:labelId')
  @ApiOperation({
    summary: 'Get albums by label',
    description: 'Retrieve all albums from a specific record label',
  })
  @ApiParam({ name: 'labelId', type: Number, description: 'Record label ID' })
  @ApiResponse({ status: 200, description: 'Albums retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Label not found' })
  async getAlbumsByLabel(@Param('labelId', ParseIntPipe) labelId: number) {
    return this.albumService.getAlbumsByLabel(labelId)
  }
}
