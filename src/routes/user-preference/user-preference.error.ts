import { NotFoundException, ConflictException } from '@nestjs/common'

export const UserPreferenceNotFoundException = new NotFoundException({
  message: 'User preference not found',
  error: 'USER_PREFERENCE_NOT_FOUND',
})

export const UserPreferenceAlreadyExistsException = new ConflictException({
  message: 'User preference already exists',
  error: 'USER_PREFERENCE_ALREADY_EXISTS',
})

export const InvalidGenreException = new ConflictException({
  message: 'One or more genre IDs are invalid',
  error: 'INVALID_GENRE',
})
