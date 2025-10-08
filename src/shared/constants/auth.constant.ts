export const REQUEST_USER_KEY = 'user'
export const REQUEST_ROLE_PERMISSION = 'role_permissions'

export const AUTH_TYPE_KEY = 'authType'

export const AuthType = {
  Bearer: 'Bearer',
  PaymentApiKey: 'PaymentApiKey',
  None: 'None',
} as const

export const ConditionGuard = {
  And: 'And',
  Or: 'Or',
} as const

export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
} as const

export const UserGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
}

export const TypeOfVerificationCode = {
  REGISTER: 'REGISTER',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  LOGIN: 'LOGIN',
  DISABLED_2FA: 'DISABLED_2FA',
} as const
