export type AccessTokenPayloadCreate = {
  userId: number
  roleId: number
  roleName: string
}

export type RefreshTokenPayloadCreate = Pick<AccessTokenPayloadCreate, 'userId'>

export type AccessTokenPayloadReturn = AccessTokenPayloadCreate & {
  exp: number
  iat: number
  jti: number
}

export type RefreshTokenPayloadReturn = RefreshTokenPayloadCreate & {
  exp: number
  iat: number
  jti: number
}
