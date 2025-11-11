import { NotFound } from '@aws-sdk/client-s3'
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common'

export const ListeningHistoryNotFoundError = new NotFoundException([
  {
    path: 'listeningHistoryId',
    message: 'Error.ListeningHistoryNotFound',
  },
])

export const UnauthorizedHistoryAccessError = new UnauthorizedException([
  {
    path: 'listeningHistoryId',
    message: 'Error.UnauthorizedHistoryAccess',
  },
])

export const InvalidDateRangeError = new BadRequestException([
  {
    path: 'dateRange',
    message: 'Error.InvalidDateRange',
  },
])

export const SongNotFoundError = new NotFoundException([
  {
    path: 'songId',
    message: 'Error.SongNotFound',
  },
])

export const InvalidSongIdError = new BadRequestException([
  {
    path: 'songId',
    message: 'Error.InvalidSongId',
  },
])
