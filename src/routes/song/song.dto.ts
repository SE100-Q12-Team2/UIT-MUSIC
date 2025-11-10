import { createZodDto } from 'nestjs-zod'
import {
  GetSongsQuerySchema,
  GetTrendingSongsQuerySchema,
  IncrementPlayCountSchema,
  CreateSongSchema,
  UpdateSongSchema,
  UpdateSongArtistsSchema,
  SongSchema,
  PaginatedSongsSchema,
  SongCreatedSchema,
  SongUpdatedSchema,
  PlayCountIncrementedSchema,
  TrendingSongsSchema,
} from './song.model'

export class GetSongsQueryDto extends createZodDto(GetSongsQuerySchema) {}
export class GetTrendingSongsQueryDto extends createZodDto(GetTrendingSongsQuerySchema) {}
export class IncrementPlayCountDto extends createZodDto(IncrementPlayCountSchema) {}

export class CreateSongDto extends createZodDto(CreateSongSchema) {}
export class UpdateSongDto extends createZodDto(UpdateSongSchema) {}
export class UpdateSongArtistsDto extends createZodDto(UpdateSongArtistsSchema) {}

export class SongDto extends createZodDto(SongSchema) {}
export class PaginatedSongsDto extends createZodDto(PaginatedSongsSchema) {}
export class SongCreatedDto extends createZodDto(SongCreatedSchema) {}
export class SongUpdatedDto extends createZodDto(SongUpdatedSchema) {}
export class PlayCountIncrementedDto extends createZodDto(PlayCountIncrementedSchema) {}
export class TrendingSongsDto extends createZodDto(TrendingSongsSchema) {}
