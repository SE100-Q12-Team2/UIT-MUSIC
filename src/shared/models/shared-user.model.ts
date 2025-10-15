import { AccountStatusEnum, GenderEnum, UserRoleEnum } from 'src/shared/constants/user.constant'
import {
  FullNameMustHaveAtLeast1CharacterError,
  InvalidEmailError,
  PasswordMustHaveAtLeast6CharactersError,
  PasswordMustHaveAtMost100CharactersError,
} from 'src/shared/errors'
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
  dateOfBirth: z.date().nullable(),
  gender: GenderEnum.nullable(),
  roleId: z.number().positive(),
  accountStatus: AccountStatusEnum.default('Active'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
})

export type UserType = z.infer<typeof UserSchema>
