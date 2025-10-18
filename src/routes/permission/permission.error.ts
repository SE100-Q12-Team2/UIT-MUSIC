import { UnprocessableEntityException } from '@nestjs/common'

export const PermissionAlreadyExist = new UnprocessableEntityException([
  {
    path: 'path',
    message: 'Error.PermissionAlreadyExist',
  },
  {
    path: 'method',
    message: 'Error.PermissionAlreadyExist',
  },
])
