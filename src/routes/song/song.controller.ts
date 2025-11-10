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

@Controller('songs')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @Get()
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PaginatedSongsDto)
  async getSongs(@Query() query: GetSongsQueryDto, @ActiveUser('userId') userId?: number) {
    return this.songService.getSongs(query, userId)
  }

  @Get('trending')
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(TrendingSongsDto)
  async getTrendingSongs(@Query() query: GetTrendingSongsQueryDto, @ActiveUser('userId') userId?: number) {
    return this.songService.getTrendingSongs(query, userId)
  }

  @Get(':id')
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SongDto)
  async getSongById(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId?: number) {
    return this.songService.getSongById(id, userId)
  }

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(SongCreatedDto)
  async createSong(@Body() createSongDto: CreateSongDto, @ActiveUser('userId') userId: number) {
    return this.songService.createSong(createSongDto, userId)
  }

  @Put(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SongUpdatedDto)
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
  async deleteSong(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    return this.songService.deleteSong(id, userId)
  }

  @Post(':id/play')
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PlayCountIncrementedDto)
  async incrementPlayCount(@Param('id', ParseIntPipe) id: number) {
    return this.songService.incrementPlayCount(id)
  }
}
