import { createZodDto } from 'nestjs-zod'
import { GetPlaylistQuerySchema, GetPlaylistsResponseSchema } from 'src/routes/playlist/playlist.model'

export class GetAllPlaylistsDTO extends createZodDto(GetPlaylistsResponseSchema) {}

export class GetPlaylistQueryDTO extends createZodDto(GetPlaylistQuerySchema) {}
