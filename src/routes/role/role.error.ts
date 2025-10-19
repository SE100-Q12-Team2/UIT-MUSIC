import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common'

export const RoleAlreadyExistException = new UnprocessableEntityException([
  {
    path: 'name',
    message: 'Error.RoleAlreadyExist',
  },
])

export const RoleNotFoundException = new NotFoundException([
  {
    path: 'id',
    message: 'Error.RoleNotFound',
  },
])

export const ProhibitedActionOnBaseRoleException = new ForbiddenException('Error.ProhibitedActionOnBaseRole')