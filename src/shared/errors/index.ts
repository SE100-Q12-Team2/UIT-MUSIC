import { UnprocessableEntityException } from '@nestjs/common'

export const InvalidEmailError = new UnprocessableEntityException('Invalid email')
export const PasswordMustHaveAtLeast6CharactersError = new UnprocessableEntityException(
  'Password must have at least 6 characters',
)
export const PasswordMustHaveAtMost100CharactersError = new UnprocessableEntityException(
  'Password must have at most 100 characters',
)

export const FullNameMustHaveAtLeast1CharacterError = new UnprocessableEntityException(
  'Full name must have at least 1 character',
)
