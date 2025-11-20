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
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
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
  constructor(private readonly songService: SongService) {}

  @Get()
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PaginatedSongsDto)
  @ApiOperation({
    summary: 'Get all songs',
    description:
      'Retrieve paginated list of songs with optional filtering by genre, artist, album, label, and language',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'genreId', required: false, type: Number, description: 'Filter by genre ID' })
  @ApiQuery({ name: 'artistId', required: false, type: Number, description: 'Filter by artist ID' })
  @ApiQuery({ name: 'albumId', required: false, type: Number, description: 'Filter by album ID' })
  @ApiQuery({ name: 'labelId', required: false, type: Number, description: 'Filter by record label ID' })
  @ApiQuery({ name: 'language', required: false, type: String, description: 'Filter by language' })
  @ApiQuery({ name: 'order', required: false, enum: ['latest', 'popular', 'title'], description: 'Sort order' })
  @ApiResponse({ status: 200, description: 'Songs retrieved successfully', type: PaginatedSongsDto })
  async getSongs(@Query() query: GetSongsQueryDto, @ActiveUser('userId') userId?: number) {
    return this.songService.getSongs(query, userId)
  }

  @Get('trending')
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(TrendingSongsDto)
  @ApiOperation({
    summary: 'Get trending songs',
    description: 'Retrieve currently trending songs based on play count and recent popularity',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of songs (default: 10, max: 50)' })
  @ApiQuery({ name: 'genreId', required: false, type: Number, description: 'Filter by genre ID' })
  @ApiResponse({ status: 200, description: 'Trending songs retrieved successfully', type: TrendingSongsDto })
  async getTrendingSongs(@Query() query: GetTrendingSongsQueryDto, @ActiveUser('userId') userId?: number) {
    return this.songService.getTrendingSongs(query, userId)
  }

  @Get(':id')
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SongDto)
  @ApiOperation({
    summary: 'Get song by ID',
    description: 'Retrieve detailed information about a specific song including artists, album, and genre',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Song ID' })
  @ApiResponse({ status: 200, description: 'Song found', type: SongDto })
  @ApiResponse({ status: 404, description: 'Song not found' })
  async getSongById(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId?: number) {
    return this.songService.getSongById(id, userId)
  }

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(SongCreatedDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new song',
    description: 'Upload a new song with metadata including title, duration, artists, album, and genre',
  })
  @ApiResponse({ status: 201, description: 'Song created successfully', type: SongCreatedDto })
  @ApiResponse({ status: 400, description: 'Invalid song data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createSong(@Body() createSongDto: CreateSongDto, @ActiveUser('userId') userId: number) {
    return this.songService.createSong(createSongDto, userId)
  }

  @Put(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SongUpdatedDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update song',
    description: 'Update song metadata and information',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Song ID' })
  @ApiResponse({ status: 200, description: 'Song updated successfully', type: SongUpdatedDto })
  @ApiResponse({ status: 400, description: 'Invalid song data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Song not found' })
  async updateSong(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongDto: UpdateSongDto,
    @ActiveUser('userId') userId: number,
  ) {
    return this.songService.updateSong(id, updateSongDto, userId)
  }

  @Put(':id/artists')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SongUpdatedDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update song artists',
    description: 'Update the list of artists associated with a song and their roles',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Song ID' })
  @ApiResponse({ status: 200, description: 'Song artists updated successfully', type: SongUpdatedDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Song not found' })
  async updateSongArtists(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArtistsDto: UpdateSongArtistsDto,
    @ActiveUser('userId') userId: number,
  ) {
    return this.songService.updateSongArtists(id, updateArtistsDto, userId)
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SongUpdatedDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete song',
    description: 'Delete a song from the platform',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Song ID' })
  @ApiResponse({ status: 200, description: 'Song deleted successfully', type: SongUpdatedDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Song not found' })
  async deleteSong(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    return this.songService.deleteSong(id, userId)
  }

  @Post(':id/play')
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PlayCountIncrementedDto)
  @ApiOperation({
    summary: 'Increment play count',
    description: 'Track song play and increment the play counter for analytics',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Song ID' })
  @ApiResponse({ status: 200, description: 'Play count incremented', type: PlayCountIncrementedDto })
  @ApiResponse({ status: 404, description: 'Song not found' })
  async incrementPlayCount(@Param('id', ParseIntPipe) id: number) {
    return this.songService.incrementPlayCount(id)
  }
}
