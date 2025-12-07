import { UserSchema } from 'src/shared/models/shared-user.model'
import { z } from 'zod'

export const UpdateProfileBodySchema = UserSchema.pick({
  email: true,
  fullName: true,
  gender: true,
  profileImage: true,
})
  .extend({
    dateOfBirth: z.string().optional(),
  })
  .partial({
    email: true,
    fullName: true,
    gender: true,
    profileImage: true,
  })

export const UpdateProfileResSchema = UserSchema.omit({
  password: true,
})

export const ChangePasswordBodySchema = UserSchema.pick({
  password: true,
})
  .extend({
    newPassword: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .strict()
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (confirmPassword !== newPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Error.PasswordNotMatch',
      })
    }
  })

export type UpdateProfileBodyType = z.infer<typeof UpdateProfileBodySchema>

export type ChangePasswordBodyType = z.infer<typeof ChangePasswordBodySchema>
