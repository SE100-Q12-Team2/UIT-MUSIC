import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Logger,
} from '@nestjs/common'
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
import { SongService } from './song.service'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import {
  GetSongsQueryDto,
  GetTrendingSongsQueryDto,
  CreateSongDto,
  UpdateSongDto,
  UpdateSongArtistsDto,
  SongDto,
  PaginatedSongsDto,
  SongCreatedDto,
  SongUpdatedDto,
  PlayCountIncrementedDto,
  TrendingSongsDto,
} from './song.dto'

@ApiTags('Songs')
@Controller('songs')
export class SongController {
  private readonly logger = new Logger(SongController.name)

  constructor(private readonly songService: SongService) {}

  @Get()
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PaginatedSongsDto)
  @ApiOperation({
    summary: 'Get all songs',
    description:
      'Retrieve paginated list of songs with optional filtering by genre, artist, album, label, and language. Public access available.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'genreId', required: false, type: Number, description: 'Filter by genre ID' })
  @ApiQuery({ name: 'artistId', required: false, type: Number, description: 'Filter by artist ID' })
  @ApiQuery({ name: 'albumId', required: false, type: Number, description: 'Filter by album ID' })
  @ApiQuery({ name: 'labelId', required: false, type: Number, description: 'Filter by record label ID' })
  @ApiQuery({ name: 'language', required: false, type: String, description: 'Filter by language' })
  @ApiQuery({ name: 'order', required: false, enum: ['latest', 'popular', 'title'], description: 'Sort order' })
  @ApiOkResponse({ 
    description: 'Songs retrieved successfully', 
    type: PaginatedSongsDto,
  })
  async getSongs(@Query() query: GetSongsQueryDto, @ActiveUser('userId') userId?: number) {
    try {
      this.logger.log(`Get songs request with filters: ${JSON.stringify(query)}`)
      return await this.songService.getSongs(query, userId)
    } catch (error) {
      this.logger.error('Failed to get songs', error.stack)
      throw error
    }
  }

  @Get('trending')
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(TrendingSongsDto)
  @ApiOperation({
    summary: 'Get trending songs',
    description: 'Retrieve currently trending songs based on play count and recent popularity. Public access available.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of songs (default: 10, max: 50)' })
  @ApiQuery({ name: 'genreId', required: false, type: Number, description: 'Filter by genre ID' })
  @ApiOkResponse({ 
    description: 'Trending songs retrieved successfully', 
    type: TrendingSongsDto,
  })
  async getTrendingSongs(@Query() query: GetTrendingSongsQueryDto, @ActiveUser('userId') userId?: number) {
    try {
      this.logger.log('Get trending songs request')
      return await this.songService.getTrendingSongs(query, userId)
    } catch (error) {
      this.logger.error('Failed to get trending songs', error.stack)
      throw error
    }
  }

  @Get(':id')
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SongDto)
  @ApiOperation({
    summary: 'Get song by ID',
    description: 'Retrieve detailed information about a specific song including artists, album, genre, and user favorite status. Public access available.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Song ID' })
  @ApiOkResponse({ 
    description: 'Song found and retrieved successfully', 
    type: SongDto,
  })
  @ApiNotFoundResponse({ 
    description: 'Song not found',
  })
  async getSongById(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId?: number) {
    try {
      this.logger.log(`Get song by ID: ${id}`)
      return await this.songService.getSongById(id, userId)
    } catch (error) {
      this.logger.error(`Failed to get song by ID: ${id}`, error.stack)
      throw error
    }
  }

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(SongCreatedDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new song',
    description: 'Upload a new song with metadata including title, duration, artists, album, and genre. Requires authentication and appropriate permissions.',
  })
  @ApiBody({
    type: CreateSongDto,
    description: 'Song information and metadata',
  })
  @ApiCreatedResponse({ 
    description: 'Song created successfully', 
    type: SongCreatedDto,
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid song data or validation failed',
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async createSong(@Body() createSongDto: CreateSongDto, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Create song attempt by user ID: ${userId}`)
      const result = await this.songService.createSong(createSongDto, userId)
      this.logger.log(`Song created successfully: ${result.title}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to create song by user ID: ${userId}`, error.stack)
      throw error
    }
  }

  @Put(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SongUpdatedDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update song',
    description: 'Update song metadata and information. Requires authentication and appropriate permissions.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Song ID to update' })
  @ApiBody({
    type: UpdateSongDto,
    description: 'Song fields to update',
  })
  @ApiOkResponse({ 
    description: 'Song updated successfully', 
    type: SongUpdatedDto,
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid song data or validation failed',
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiNotFoundResponse({ 
    description: 'Song not found',
  })
  async updateSong(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongDto: UpdateSongDto,
    @ActiveUser('userId') userId: number,
  ) {
    try {
      this.logger.log(`Update song ID: ${id} by user ID: ${userId}`)
      const result = await this.songService.updateSong(id, updateSongDto, userId)
      this.logger.log(`Song updated successfully ID: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update song ID: ${id}`, error.stack)
      throw error
    }
  }

  @Put(':id/artists')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SongUpdatedDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update song artists',
    description: 'Update the list of artists associated with a song and their roles (Main Artist, Featured Artist, Composer, Producer).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Song ID' })
  @ApiBody({
    type: UpdateSongArtistsDto,
    description: 'Updated list of artists and their roles',
  })
  @ApiOkResponse({ 
    description: 'Song artists updated successfully', 
    type: SongUpdatedDto,
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiNotFoundResponse({ 
    description: 'Song not found',
  })
  async updateSongArtists(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArtistsDto: UpdateSongArtistsDto,
    @ActiveUser('userId') userId: number,
  ) {
    try {
      this.logger.log(`Update artists for song ID: ${id} by user ID: ${userId}`)
      const result = await this.songService.updateSongArtists(id, updateArtistsDto, userId)
      this.logger.log(`Song artists updated successfully ID: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update song artists ID: ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SongUpdatedDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete song',
    description: 'Soft delete a song from the platform. Song will be marked as deleted but data is preserved.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Song ID to delete' })
  @ApiOkResponse({ 
    description: 'Song deleted successfully', 
    type: SongUpdatedDto,
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiNotFoundResponse({ 
    description: 'Song not found',
  })
  async deleteSong(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Delete song ID: ${id} by user ID: ${userId}`)
      const result = await this.songService.deleteSong(id, userId)
      this.logger.log(`Song deleted successfully ID: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete song ID: ${id}`, error.stack)
      throw error
    }
  }

  @Post(':id/play')
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PlayCountIncrementedDto)
  @ApiOperation({
    summary: 'Increment play count',
    description: 'Track song play and increment the play counter for analytics and trending calculations. Public access available.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Song ID' })
  @ApiOkResponse({ 
    description: 'Play count incremented successfully', 
    type: PlayCountIncrementedDto,
  })
  @ApiNotFoundResponse({ 
    description: 'Song not found',
  })
  async incrementPlayCount(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Increment play count for song ID: ${id}`)
      return await this.songService.incrementPlayCount(id)
    } catch (error) {
      this.logger.error(`Failed to increment play count for song ID: ${id}`, error.stack)
      throw error
    }
  }
}
