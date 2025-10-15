import z from 'zod'

export const GenderEnum = z.enum(['Male', 'Female', 'Other'])
export const UserRoleEnum = z.enum(['Admin', 'Listener', 'Label'])
export const AccountStatusEnum = z.enum(['Active', 'Inactive', 'Banned', 'Suspended'])
