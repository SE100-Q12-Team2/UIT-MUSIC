import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { REQUEST_ROLE_PERMISSION } from 'src/shared/constants/auth.constant'
import { RoleType } from 'src/shared/models/shared-role.model'

export const ActiveRole = createParamDecorator((field: keyof RoleType | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()

  const role: RoleType = request[REQUEST_ROLE_PERMISSION]

  return field ? role?.[field] : role
})
