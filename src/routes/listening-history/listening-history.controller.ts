import { Controller, Get, Post, Delete, Body, Query, Param, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger'
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

@ApiTags('Listening History')
@Controller('listening-history')
export class ListeningHistoryController {
  private readonly logger = new Logger(ListeningHistoryController.name)

  constructor(private readonly listeningHistoryService: ListeningHistoryService) {}

  @Post('track')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(TrackSongResponseDto)
  @ApiOperation({
    summary: 'Track song play',
    description: 'Record a song play in user listening history including playback duration and completion status. Used for generating recommendations and statistics.',
  })
  @ApiBody({ type: CreateListeningHistoryDto, description: 'Song tracking data including song ID and playback details' })
  @ApiCreatedResponse({ description: 'Song play tracked successfully', type: TrackSongResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid tracking data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async trackSong(@ActiveUser('userId') userId: number, @Body() dto: CreateListeningHistoryDto) {
    try {
      this.logger.log(`Track song ${dto.songId} for user ${userId}`)
      const result = await this.listeningHistoryService.trackSong(userId, dto)
      this.logger.log(`Song ${dto.songId} tracked for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to track song ${dto.songId} for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get('my-history')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(PaginatedListeningHistoryResponseDto)
  @ApiOperation({
    summary: 'Get listening history',
    description: 'Retrieve paginated listening history for authenticated user with filtering options by date range and song. Includes song details and playback timestamps.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter from date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter to date (ISO format)' })
  @ApiOkResponse({ description: 'Listening history retrieved successfully', type: PaginatedListeningHistoryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getMyHistory(@ActiveUser('userId') userId: number, @Query() query: GetListeningHistoryQueryDto) {
    try {
      this.logger.log(`Get listening history for user ${userId}`)
      const result = await this.listeningHistoryService.getUserHistory(userId, query)
      this.logger.log(`Retrieved ${result.data.length} history items for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get listening history for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get('recently-played')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(RecentlyPlayedResponseDto)
  @ApiOperation({
    summary: 'Get recently played songs',
    description: 'Retrieve list of recently played songs for authenticated user ordered by play time. Useful for displaying recent listening activity.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of songs to return (default: 20)' })
  @ApiOkResponse({ description: 'Recently played songs retrieved successfully', type: RecentlyPlayedResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getRecentlyPlayed(
    @ActiveUser('userId') userId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    try {
      this.logger.log(`Get recently played for user ${userId}, limit: ${limit || 20}`)
      const result = await this.listeningHistoryService.getRecentlyPlayed(userId, limit)
      this.logger.log(`Recently played retrieved for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get recently played for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UserListeningStatsDto)
  @ApiOperation({
    summary: 'Get listening statistics',
    description: 'Retrieve comprehensive listening statistics for authenticated user including total plays, unique songs, top genres, and listening time. Supports filtering by date range.',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Stats from date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Stats to date (ISO format)' })
  @ApiOkResponse({ description: 'Listening stats retrieved successfully', type: UserListeningStatsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getUserStats(@ActiveUser('userId') userId: number, @Query() query: GetUserStatsQueryDto) {
    try {
      this.logger.log(`Get listening stats for user ${userId}`)
      const result = await this.listeningHistoryService.getUserStats(userId, query)
      this.logger.log(`Listening stats retrieved for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get listening stats for user ${userId}`, error.stack)
      throw error
    }
  }

  @Delete('clear')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(ClearHistoryResponseDto)
  @ApiOperation({
    summary: 'Clear listening history',
    description: 'Clear all listening history for authenticated user. This action permanently removes all playback records and cannot be undone.',
  })
  @ApiOkResponse({ description: 'Listening history cleared successfully', type: ClearHistoryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async clearHistory(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Clear listening history for user ${userId}`)
      const result = await this.listeningHistoryService.clearUserHistory(userId)
      this.logger.log(`Listening history cleared for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to clear listening history for user ${userId}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Delete history item',
    description: 'Delete a specific listening history entry for authenticated user. Removes individual playback record from history.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'History item ID to delete' })
  @ApiOkResponse({ description: 'History item deleted successfully', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'History item not found' })
  async deleteHistoryItem(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) historyId: number) {
    try {
      this.logger.log(`Delete history item ${historyId} for user ${userId}`)
      const result = await this.listeningHistoryService.deleteHistoryItem(userId, historyId)
      this.logger.log(`History item ${historyId} deleted for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete history item ${historyId} for user ${userId}`, error.stack)
      throw error
    }
  }
}
