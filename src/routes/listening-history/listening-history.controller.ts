import { Controller, Get, Post, Delete, Body, Query, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common'
import { ListeningHistoryService } from './listening-history.service'
import {
  CreateListeningHistoryDto,
  TrackSongResponseDto,
  ClearHistoryResponseDto,
  GetListeningHistoryQueryDto,
  GetUserStatsQueryDto,
  PaginatedListeningHistoryResponseDto,
  RecentlyPlayedResponseDto,
  UserListeningStatsDto,
} from './listening-history.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('listening-history')
export class ListeningHistoryController {
  constructor(private readonly listeningHistoryService: ListeningHistoryService) {}

  @Post('track')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(TrackSongResponseDto)
  async trackSong(@ActiveUser('userId') userId: number, @Body() dto: CreateListeningHistoryDto) {
    return await this.listeningHistoryService.trackSong(userId, dto)
  }

  @Get('my-history')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(PaginatedListeningHistoryResponseDto)
  async getMyHistory(@ActiveUser('userId') userId: number, @Query() query: GetListeningHistoryQueryDto) {
    return await this.listeningHistoryService.getUserHistory(userId, query)
  }

  @Get('recently-played')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(RecentlyPlayedResponseDto)
  async getRecentlyPlayed(
    @ActiveUser('userId') userId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return await this.listeningHistoryService.getRecentlyPlayed(userId, limit)
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(UserListeningStatsDto)
  async getUserStats(@ActiveUser('userId') userId: number, @Query() query: GetUserStatsQueryDto) {
    return await this.listeningHistoryService.getUserStats(userId, query)
  }

  @Delete('clear')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(ClearHistoryResponseDto)
  async clearHistory(@ActiveUser('userId') userId: number) {
    return await this.listeningHistoryService.clearUserHistory(userId)
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  async deleteHistoryItem(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) historyId: number) {
    return await this.listeningHistoryService.deleteHistoryItem(userId, historyId)
  }
}
