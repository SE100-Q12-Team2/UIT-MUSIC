// src/routes/playlist-tracks/playlist-tracks.model.ts
import { PlaylistSongSchema } from 'src/routes/playlist/playlist.model'
import z from 'zod'

export const ListPlaylistTracksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['position', 'addedAt']).default('position'),
  order: z.enum(['asc', 'desc']).default('asc'),

  addedFrom: z.coerce.date().optional(),
  addedTo: z.coerce.date().optional(),
  minDuration: z.coerce.number().int().min(0).optional(),
  maxDuration: z.coerce.number().int().min(0).optional(),
  songTitle: z.string().trim().optional(),

  albumId: z.coerce.number().int().optional(),
  albumTitle: z.string().trim().optional(),

  artistId: z.coerce.number().int().optional(),
  artistName: z.string().trim().optional(),
})

export const GetPlaylistTracksResSchema = z.object({
  data: z.array(PlaylistSongSchema),
  page: z.number().int(),
  totalPages: z.number().int(),
  totalItems: z.number().int(),
  limit: z.number().int(),
})

export const AddTrackBodySchema = z
  .object({
    trackId: z.number().int().positive(),
    beforeTrackId: z.number().int().positive().optional(),
    afterTrackId: z.number().int().positive().optional(),
  })
  .refine((v) => !(v.beforeTrackId && v.afterTrackId), {
    message: 'Chỉ truyền 1 trong 2: beforeTrackId hoặc afterTrackId',
  })

export const BulkAddTracksBodySchema = z.object({
  trackIds: z.array(z.number().int().positive()).min(1),
  insertAt: z.enum(['head', 'tail']).default('tail'),
})

export const ReorderTrackBodySchema = z
  .object({
    beforeTrackId: z.number().int().positive().optional(),
    afterTrackId: z.number().int().positive().optional(),
  })
  .refine((v) => v.beforeTrackId || v.afterTrackId, {
    message: 'Cần có beforeTrackId hoặc afterTrackId',
  })
  .refine((v) => !(v.beforeTrackId && v.afterTrackId), {
    message: 'Chỉ truyền 1 trong 2: beforeTrackId hoặc afterTrackId',
  })

export type ReorderTrackBody = z.infer<typeof ReorderTrackBodySchema>
export type ListPlaylistTracksQuery = z.infer<typeof ListPlaylistTracksQuerySchema>
export type BulkAddTracksBody = z.infer<typeof BulkAddTracksBodySchema>
export type AddTrackBody = z.infer<typeof AddTrackBodySchema>
export type GetPlaylistTracksResType = z.infer<typeof GetPlaylistTracksResSchema>
