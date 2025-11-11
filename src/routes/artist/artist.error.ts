import { NotFoundException, BadRequestException } from '@nestjs/common'

export const ArtistNotFoundError = new NotFoundException([
  {
    path: 'artistId',
    message: 'Error.ArtistNotFound',
  },
])

export const ArtistAlreadyExistsError = new BadRequestException([
  {
    path: 'artistName',
    message: 'Error.ArtistAlreadyExists',
  },
])

export const InvalidArtistIdError = new BadRequestException([
  {
    path: 'artistId',
    message: 'Error.InvalidArtistId',
  },
])
