import { createZodDto } from 'nestjs-zod'
import {
  GetAlbumsQuerySchema,
  CreateAlbumSchema,
  UpdateAlbumSchema,
  AlbumSchema,
  PaginatedAlbumsSchema,
} from './album.model'

export class GetAlbumsQueryDto extends createZodDto(GetAlbumsQuerySchema) {}

export class CreateAlbumDto extends createZodDto(CreateAlbumSchema) {}
export class UpdateAlbumDto extends createZodDto(UpdateAlbumSchema) {}

export class AlbumResponseDto extends createZodDto(AlbumSchema) {}
export class PaginatedAlbumsResponseDto extends createZodDto(PaginatedAlbumsSchema) {}
