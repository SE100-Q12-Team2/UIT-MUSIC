import z from 'zod'

export const GenderEnum = z.enum(['Male', 'Female', 'Other', 'Unspecified'])
export const UserRoleEnum = z.enum(['Admin', 'Listener', 'Artist', 'Publisher'])
export const AccountStatusEnum = z.enum(['Active', 'Inactive', 'Banned', 'Suspended'])
