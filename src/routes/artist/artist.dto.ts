import { createZodDto } from 'nestjs-zod'
import {
  ArtistSchema,
  GetArtistQuerySchema,
  GetArtistsResponseSchema,
  CreateArtistBodySchema,
  CreateArtistResSchema,
  UpdateArtistBodySchema,
  UpdateArtistResSchema,
} from './artist.model'

export class GetArtistQueryDto extends createZodDto(GetArtistQuerySchema) {}

export class ArtistResponseDto extends createZodDto(ArtistSchema) {}
export class GetArtistsResponseDto extends createZodDto(GetArtistsResponseSchema) {}

export class CreateArtistBodyDto extends createZodDto(CreateArtistBodySchema) {}
export class CreateArtistResDto extends createZodDto(CreateArtistResSchema) {}

export class UpdateArtistBodyDto extends createZodDto(UpdateArtistBodySchema) {}
export class UpdateArtistResDto extends createZodDto(UpdateArtistResSchema) {}
