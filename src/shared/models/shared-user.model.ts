import { PermissionSchema } from 'src/routes/permission/permission.model'
import { AccountStatusEnum, GenderEnum } from 'src/shared/constants/user.constant'
import {
  FullNameMustHaveAtLeast1CharacterError,
  InvalidEmailError,
  PasswordMustHaveAtLeast6CharactersError,
  PasswordMustHaveAtMost100CharactersError,
} from 'src/shared/errors'
import { RoleSchema } from 'src/shared/models/shared-role.model'
import z from 'zod'

export const UserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email({
    message: InvalidEmailError.message,
  }),
  password: z
    .string()
    .min(6, {
      message: PasswordMustHaveAtLeast6CharactersError.message,
    })
    .max(100, {
      message: PasswordMustHaveAtMost100CharactersError.message,
    }),
  fullName: z.string().min(1, { message: FullNameMustHaveAtLeast1CharacterError.message }),
  dateOfBirth: z.string().nullable(),
  gender: GenderEnum.nullable(),
  roleId: z.number().positive(),
  profileImage: z.string().nullable(),
  accountStatus: AccountStatusEnum.default('Active'),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
})

export const GetUserProfileSchema = UserSchema.omit({
  totpSecret: true,
  password: true,
}).extend({
  role: RoleSchema.pick({
    id: true,
    name: true,
  }).extend({
    permissions: z.array(
      PermissionSchema.pick({
        name: true,
        path: true,
        method: true,
        module: true,
      }),
    ),
  }),
})

export type GetUserProfileSchema = z.infer<typeof GetUserProfileSchema>

export type UserType = z.infer<typeof UserSchema>
