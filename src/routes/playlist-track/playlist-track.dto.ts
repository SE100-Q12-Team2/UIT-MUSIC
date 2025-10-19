import { createZodDto } from 'nestjs-zod'
import { GetPlaylistTracksResSchema } from 'src/routes/playlist-track/playlist-track.model'

export class GetPlaylistTracksResDTO extends createZodDto(GetPlaylistTracksResSchema) {}
