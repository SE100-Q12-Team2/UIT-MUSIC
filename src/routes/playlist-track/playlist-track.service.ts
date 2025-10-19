import { BadRequestException, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AddTrackBody, BulkAddTracksBody, GetPlaylistTracksResType, ListPlaylistTracksQuery, ReorderTrackBody } from 'src/routes/playlist-track/playlist-track.model'
import { PlaylistTracksRepository } from 'src/routes/playlist-track/playlist-track.repo'

const STEP = 1000

@Injectable()
export class PlaylistTracksService {
  constructor(
    private readonly repo: PlaylistTracksRepository,
    private readonly events: EventEmitter2,
  ) {}

  async list(playlistId: number, q: ListPlaylistTracksQuery): Promise<GetPlaylistTracksResType> {
    await this.repo.ensurePlaylist(playlistId)
    return this.repo.list(playlistId, q)
  }

  private computePosition(left: number | null, right: number | null): number {
    if (left !== null && right !== null) {
      const mid = Math.floor((left + right) / 2)
      if (mid === left || mid === right) {
        throw new Error('NEED_RENORMALIZE')
      }
      return mid
    }
    if (left !== null && right === null) return left + STEP // chèn sau left
    if (left === null && right !== null) return right - STEP // chèn trước right
    return STEP // playlist rỗng
  }

  async addOne(playlistId: number, body: AddTrackBody, actorId: number) {
    await this.repo.ensurePlaylist(playlistId)

    const existed = await this.repo.findRow(playlistId, body.trackId)
    if (existed) return existed // idempotent

    let left: number | null = null
    let right: number | null = null

    if (body.beforeTrackId) {
      const n = await this.repo.neighborByBefore(playlistId, body.beforeTrackId)
      left = n.left
      right = n.right
    } else if (body.afterTrackId) {
      const n = await this.repo.neighborByAfter(playlistId, body.afterTrackId)
      left = n.left
      right = n.right
    } else {
      const max = await this.repo.maxPosition(playlistId)
      left = max ?? null
      right = null
    }

    let pos: number
    try {
      pos = this.computePosition(left, right)
    } catch (e) {
      if ((e as Error).message === 'NEED_RENORMALIZE') {
        await this.repo.renormalize(playlistId)
        // tính lại
        if (body.beforeTrackId) {
          const n = await this.repo.neighborByBefore(playlistId, body.beforeTrackId)
          pos = this.computePosition(n.left, n.right)
        } else if (body.afterTrackId) {
          const n = await this.repo.neighborByAfter(playlistId, body.afterTrackId)
          pos = this.computePosition(n.left, n.right)
        } else {
          const max = await this.repo.maxPosition(playlistId)
          pos = this.computePosition(max ?? null, null)
        }
      } else throw e
    }

    const row = await this.repo.create(playlistId, body.trackId, pos)

    this.events.emit('playlist.track.added', {
      playlistId,
      trackId: body.trackId,
      by: actorId,
      at: new Date().toISOString(),
    })

    return row
  }

  async addBulk(playlistId: number, body: BulkAddTracksBody, actorId: number) {
    await this.repo.ensurePlaylist(playlistId)

    const ops: Promise<any>[] = []
    if (body.insertAt === 'head') {
      const min = await this.repo.minPosition(playlistId)
      let cursor = (min ?? STEP) - STEP
      for (const trackId of body.trackIds) {
        const existed = await this.repo.findRow(playlistId, trackId)
        if (existed) continue
        ops.push(this.repo.create(playlistId, trackId, cursor))
        cursor -= STEP
      }
    } else {
      const max = await this.repo.maxPosition(playlistId)
      let cursor = (max ?? 0) + STEP
      for (const trackId of body.trackIds) {
        const existed = await this.repo.findRow(playlistId, trackId)
        if (existed) continue
        ops.push(this.repo.create(playlistId, trackId, cursor))
        cursor += STEP
      }
    }

    const rows = await (this.repo as any).prisma.$transaction(ops)

    for (const r of rows) {
      this.events.emit('playlist.track.added', {
        playlistId,
        trackId: r.songId,
        by: actorId,
        at: new Date().toISOString(),
      })
    }

    return { inserted: rows.length }
  }

  async reorder(playlistId: number, trackId: number, body: ReorderTrackBody, actorId: number) {
    await this.repo.ensurePlaylist(playlistId)
    const exist = await this.repo.findRow(playlistId, trackId)
    if (!exist) throw new BadRequestException('Track không tồn tại trong playlist')

    let left: number | null = null
    let right: number | null = null

    if (body.beforeTrackId) {
      const n = await this.repo.neighborByBefore(playlistId, body.beforeTrackId)
      left = n.left
      right = n.right
    } else if (body.afterTrackId) {
      const n = await this.repo.neighborByAfter(playlistId, body.afterTrackId)
      left = n.left
      right = n.right
    }

    if (left === null && right === null) {
      // mặc định đưa xuống cuối
      left = await this.repo.maxPosition(playlistId)
    }

    let next: number
    try {
      next = this.computePosition(left, right)
    } catch (e) {
      if ((e as Error).message === 'NEED_RENORMALIZE') {
        await this.repo.renormalize(playlistId)
        if (body.beforeTrackId) {
          const n = await this.repo.neighborByBefore(playlistId, body.beforeTrackId)
          next = this.computePosition(n.left, n.right)
        } else if (body.afterTrackId) {
          const n = await this.repo.neighborByAfter(playlistId, body.afterTrackId)
          next = this.computePosition(n.left, n.right)
        } else {
          const max = await this.repo.maxPosition(playlistId)
          next = this.computePosition(max ?? null, null)
        }
      } else throw e
    }

    const updated = await this.repo.updatePosition(playlistId, trackId, next)

    this.events.emit('playlist.track.reordered', {
      playlistId,
      trackId,
      by: actorId,
      at: new Date().toISOString(),
    })

    return updated
  }

  async remove(playlistId: number, trackId: number, actorId: number) {
    await this.repo.ensurePlaylist(playlistId)
    await this.repo.delete(playlistId, trackId)

    this.events.emit('playlist.track.removed', {
      playlistId,
      trackId,
      by: actorId,
      at: new Date().toISOString(),
    })

    return { message: 'Removed track successfully' }
  }
}
