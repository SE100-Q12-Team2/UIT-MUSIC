import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant'
import { AccessTokenPayloadReturn } from 'src/shared/types/jwt.type'

export const ActiveUser = createParamDecorator(
  (field: keyof AccessTokenPayloadReturn | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()

    const user: AccessTokenPayloadReturn | undefined = request[REQUEST_USER_KEY]

    return field ? user?.[field] : user
  },
)
