import { createZodDto } from 'nestjs-zod'
import {
  CreateListeningHistorySchema,
  TrackSongResponseSchema,
  ClearHistoryResponseSchema,
  GetListeningHistoryQuerySchema,
  GetUserStatsQuerySchema,
  ListeningHistoryResponseSchema,
  ListeningHistoryWithDetailsSchema,
  PaginatedListeningHistoryResponseSchema,
  RecentlyPlayedResponseSchema,
  UserListeningStatsSchema,
} from './listening-history.model'

export class CreateListeningHistoryDto extends createZodDto(CreateListeningHistorySchema) {}

export class TrackSongResponseDto extends createZodDto(TrackSongResponseSchema) {}

export class ClearHistoryResponseDto extends createZodDto(ClearHistoryResponseSchema) {}

export class GetListeningHistoryQueryDto extends createZodDto(GetListeningHistoryQuerySchema) {}

export class GetUserStatsQueryDto extends createZodDto(GetUserStatsQuerySchema) {}

export class ListeningHistoryResponseDto extends createZodDto(ListeningHistoryResponseSchema) {}

export class ListeningHistoryWithDetailsDto extends createZodDto(ListeningHistoryWithDetailsSchema) {}

export class PaginatedListeningHistoryResponseDto extends createZodDto(PaginatedListeningHistoryResponseSchema) {}

export class UserListeningStatsDto extends createZodDto(UserListeningStatsSchema) {}

export class RecentlyPlayedResponseDto extends createZodDto(RecentlyPlayedResponseSchema) {}
