import { SetMetadata } from '@nestjs/common'
import { AUTH_TYPE_KEY, AuthType, ConditionGuard } from 'src/shared/constants/auth.constant'
import { AuthTypeType, ConditionGuardType } from 'src/shared/types/auth.type'

export function Auth(authTypes: AuthTypeType[], options?: { condition: ConditionGuardType }) {
  return SetMetadata(AUTH_TYPE_KEY, { authTypes, options: options ?? { condition: ConditionGuard.And } })
}

export const IsPublic = () => Auth([AuthType.None])
