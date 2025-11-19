import { AccountStatusEnum, GenderEnum, UserRoleEnum } from 'src/shared/constants/user.constant'
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  fullName: z.string().min(1).max(255),
  dateOfBirth: z.coerce.date().nullable(),
  gender: GenderEnum.nullable().default('Male'),
  accountStatus: AccountStatusEnum.default('Active'),
  roleId: z.number(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const UserResponseSchema = UserSchema.omit({
  password: true,
  deletedAt: true,
  deletedById: true,
})

export const UserDetailResponseSchema = UserResponseSchema.extend({
  role: z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
  }),
})

export const PaginatedUsersResponseSchema = z.object({
  data: z.array(UserResponseSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    role: UserRoleEnum.optional(),
    status: AccountStatusEnum.optional(),
    search: z.string().optional(),
  })
  .strict()

export const CreateUserBodySchema = UserSchema.pick({
  email: true,
  fullName: true,
  password: true,
})
  .extend({
    roleId: z.number().int().positive().default(6),
    dateOfBirth: z.string().optional(),
    gender: GenderEnum.optional(),
  })
  .strict()

export const UpdateUserSchema = z
  .object({
    fullName: z.string().min(1).max(255).optional(),
    dateOfBirth: z.string().optional(),
    gender: GenderEnum.optional(),
  })
  .strict()

export const UpdateUserStatusSchema = z
  .object({
    accountStatus: AccountStatusEnum,
  })
  .strict()

export const UpdateUserRoleSchema = z
  .object({
    roleId: z.number().int().positive(),
  })
  .strict()

export const UserStatisticsResponseSchema = z.object({
  totalPlaylists: z.number(),
  totalFavorites: z.number(),
  totalFollows: z.number(),
  totalListeningHours: z.number(),
  activeSubscription: z.boolean(),
})

export type UserType = z.infer<typeof UserSchema>
export type UserResponseType = z.infer<typeof UserResponseSchema>
export type UserDetailResponseType = z.infer<typeof UserDetailResponseSchema>
export type PaginatedUsersResponseType = z.infer<typeof PaginatedUsersResponseSchema>
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>
export type CreateUserBodyType = z.infer<typeof CreateUserBodySchema>
export type UpdateUserType = z.infer<typeof UpdateUserSchema>
export type UpdateUserStatusType = z.infer<typeof UpdateUserStatusSchema>
export type UpdateUserRoleType = z.infer<typeof UpdateUserRoleSchema>
export type UserStatisticsResponseType = z.infer<typeof UserStatisticsResponseSchema>
