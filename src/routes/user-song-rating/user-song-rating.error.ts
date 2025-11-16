import { NotFoundException, BadRequestException } from '@nestjs/common'

export const RatingNotFoundException = new NotFoundException({
  message: 'Rating not found',
  error: 'Not Found',
})

export const SongNotFoundException = new NotFoundException({
  message: 'Song not found',
  error: 'Not Found',
})

export const InvalidRatingValueException = new BadRequestException({
  message: 'Invalid rating value. Must be Like or Dislike',
  error: 'Bad Request',
})

export const RatingAlreadyExistsException = new BadRequestException({
  message: 'You have already rated this song',
  error: 'Bad Request',
})
