import { createZodDto } from 'nestjs-zod'
import {
  CreateRatingSchema,
  UpdateRatingSchema,
  QueryUserRatingsSchema,
  RatingResponseSchema,
  RatingListResponseSchema,
  SongRatingStatsSchema,
  UserRatingStatsSchema,
} from './user-song-rating.model'

export class CreateRatingDto extends createZodDto(CreateRatingSchema) {}
export class UpdateRatingDto extends createZodDto(UpdateRatingSchema) {}
export class QueryUserRatingsDto extends createZodDto(QueryUserRatingsSchema) {}

export class RatingResponseDto extends createZodDto(RatingResponseSchema) {}
export class RatingListResponseDto extends createZodDto(RatingListResponseSchema) {}
export class SongRatingStatsDto extends createZodDto(SongRatingStatsSchema) {}
export class UserRatingStatsDto extends createZodDto(UserRatingStatsSchema) {}
