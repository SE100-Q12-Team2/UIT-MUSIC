import { createZodDto } from 'nestjs-zod'
import {
  AddFavoriteBodySchema,
  AddFavoriteResSchema,
  CheckFavoriteQuerySchema,
  CheckFavoriteResSchema,
  GetFavoritesQuerySchema,
  GetFavoritesResponseSchema,
} from 'src/routes/favorite/favorite.model'

export class GetFavoritesQueryDTO extends createZodDto(GetFavoritesQuerySchema) {}
export class GetFavoritesResponseDTO extends createZodDto(GetFavoritesResponseSchema) {}

export class AddFavoriteBodyDTO extends createZodDto(AddFavoriteBodySchema) {}
export class AddFavoriteResDTO extends createZodDto(AddFavoriteResSchema) {}

export class CheckFavoriteQueryDTO extends createZodDto(CheckFavoriteQuerySchema) {}
export class CheckFavoriteResDTO extends createZodDto(CheckFavoriteResSchema) {}
