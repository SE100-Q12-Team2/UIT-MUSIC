import { createZodDto } from 'nestjs-zod'
import {
  CreateAdvertisementSchema,
  UpdateAdvertisementSchema,
  QueryAdvertisementsSchema,
  CreateAdImpressionSchema,
  TrackAdClickSchema,
  AdvertisementResponseSchema,
  AdvertisementListResponseSchema,
  AdvertisementStatsSchema,
  GetActiveAdsSchema,
} from './advertisement.model'

export class CreateAdvertisementDto extends createZodDto(CreateAdvertisementSchema) {}
export class UpdateAdvertisementDto extends createZodDto(UpdateAdvertisementSchema) {}
export class QueryAdvertisementsDto extends createZodDto(QueryAdvertisementsSchema) {}
export class CreateAdImpressionDto extends createZodDto(CreateAdImpressionSchema) {}
export class TrackAdClickDto extends createZodDto(TrackAdClickSchema) {}
export class GetActiveAdsDto extends createZodDto(GetActiveAdsSchema) {}

export class AdvertisementResponseDto extends createZodDto(AdvertisementResponseSchema) {}
export class AdvertisementListResponseDto extends createZodDto(AdvertisementListResponseSchema) {}
export class AdvertisementStatsDto extends createZodDto(AdvertisementStatsSchema) {}
