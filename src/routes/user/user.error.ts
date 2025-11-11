import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common'

export const UserNotFoundException = new NotFoundException([
  {
    path: 'id',
    message: 'Error.UserNotFound',
  },
])

export const UserAlreadyExistException = new UnprocessableEntityException([
  {
    path: 'email',
    message: 'Error.UserAlreadyExist',
  },
])

export const CannotDeleteSelfException = new ForbiddenException('Error.CannotDeleteYourself')

export const InvalidUserStatusException = new ForbiddenException('Error.InvalidUserStatus')

export const InvalidUserRoleException = new ForbiddenException('Error.InvalidUserRole')
