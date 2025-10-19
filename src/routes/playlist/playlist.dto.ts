import { createZodDto } from 'nestjs-zod'
import {
  CreatePlaylistBodySchema,
  CreatePlaylistResSchema,
  GetPlaylistQuerySchema,
  GetPlaylistsResponseSchema,
  UpdatePlaylistResSchema,
} from 'src/routes/playlist/playlist.model'

export class GetAllPlaylistsDTO extends createZodDto(GetPlaylistsResponseSchema) {}

export class GetPlaylistQueryDTO extends createZodDto(GetPlaylistQuerySchema) {}

export class CreatePlaylistBodyDTO extends createZodDto(CreatePlaylistBodySchema) {}
export class CreatePlaylistResDTO extends createZodDto(CreatePlaylistResSchema) {}

export class UpdatePlaylistBodyDTO extends createZodDto(CreatePlaylistBodySchema.partial()) {}
export class UpdatePlaylistResDTO extends createZodDto(UpdatePlaylistResSchema) {}
