import { Injectable } from '@nestjs/common'
import { ListeningHistoryRepository } from './listening-history.repo'
import {
  CreateListeningHistoryType,
  GetListeningHistoryQueryType,
  GetUserStatsQueryType,
  PaginatedListeningHistoryResponseType,
  RecentlyPlayedResponseType,
  UserListeningStatsType,
} from './listening-history.model'
import { ListeningHistoryNotFoundError, SongNotFoundError, InvalidDateRangeError } from './listening-history.error'
import { isNotFoundPrismaError, isForeignKeyInvalidException } from 'src/shared/lib'

@Injectable()
export class ListeningHistoryService {
  constructor(private readonly listeningHistoryRepository: ListeningHistoryRepository) {}

  async trackSong(userId: number, data: CreateListeningHistoryType) {
    try {
      return await this.listeningHistoryRepository.createHistory(userId, data)
    } catch (error) {
      if (isForeignKeyInvalidException(error)) {
        throw SongNotFoundError
      }
      throw error
    }
  }

  async getUserHistory(
    userId: number,
    query: GetListeningHistoryQueryType,
  ): Promise<PaginatedListeningHistoryResponseType> {
    // Validate date range if both dates are provided
    if (query.startDate && query.endDate && query.startDate > query.endDate) {
      throw InvalidDateRangeError
    }

    return await this.listeningHistoryRepository.getUserHistory(userId, query)
  }

  async getRecentlyPlayed(userId: number, limit?: number): Promise<RecentlyPlayedResponseType> {
    return await this.listeningHistoryRepository.getRecentlyPlayed(userId, limit)
  }

  async getUserStats(userId: number, query: GetUserStatsQueryType): Promise<UserListeningStatsType> {
    if (query.startDate && query.endDate && query.startDate > query.endDate) {
      throw InvalidDateRangeError
    }

    return await this.listeningHistoryRepository.getUserStats(userId, query)
  }

  async deleteHistoryItem(userId: number, historyId: number): Promise<{ message: string }> {
    try {
      return await this.listeningHistoryRepository.deleteHistory(userId, historyId)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw ListeningHistoryNotFoundError
      }
      throw error
    }
  }

  async clearUserHistory(userId: number): Promise<{ deletedCount: number }> {
    const count = await this.listeningHistoryRepository.clearHistory(userId)
    return { deletedCount: count }
  }
}
