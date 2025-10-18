import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common'

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

export const NotFoundRecordException = new NotFoundException('Error.NotFound')

export const InvalidPasswordException = new UnprocessableEntityException('Error.InvalidPassword')

export const InvalidForeignKeyException = new BadRequestException('Error.InvalidForeignKey')

export const BrandIdNotExistException = new UnprocessableEntityException([
  {
    path: 'brandId',
    message: 'Error.Brand.BrandIdNotExist',
  },
])
