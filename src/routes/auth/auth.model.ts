import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'
import { UserSchema } from 'src/shared/models/shared-user.model'
import { z } from 'zod'

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
  fullName: true,
})
  .extend({
    confirmPassword: z.string().min(6).max(100),
    code: z.string().length(6),
    role: z.enum(['Listener', 'Label']).default('Listener'),
    labelType: z.enum(['INDIVIDUAL', 'COMPANY']).optional(),
    labelName: z.string().min(1).max(255).optional().transform(val => val === '' ? undefined : val),
  })
  .strict()
  .superRefine(({ confirmPassword, password, role, labelType, labelName }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password must match',
        path: ['confirmPassword'],
      })
    }
    if (role === 'Label' && !labelType) {
      ctx.addIssue({
        code: 'custom',
        message: 'Label type is required when registering as a label',
        path: ['labelType'],
      })
    }
    if (role === 'Label' && !labelName) {
      ctx.addIssue({
        code: 'custom',
        message: 'Label name is required when registering as a label',
        path: ['labelName'],
      })
    }
  })

export const RegisterResSchema = UserSchema.omit({
  password: true,
})

export const VerificationCodeSchema = z.object({
  id: z.number().positive(),
  email: z.string().email(),
  code: z.string().length(6),
  type: z.enum([
    TypeOfVerificationCode.FORGOT_PASSWORD,
    TypeOfVerificationCode.REGISTER,
    TypeOfVerificationCode.LOGIN,
    TypeOfVerificationCode.DISABLED_2FA,
  ]),
  expiresAt: z.string(),
  createdAt: z.string(),
})

export const SendOTPBodySchema = VerificationCodeSchema.pick({
  email: true,
  type: true,
})

export const LoginBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string(),
  })
  .strict()

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const DeviceBodySchema = z.object({
  id: z.number(),
  userId: z.number(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.string(),
  createdAt: z.string(),
  isActive: z.boolean(),
})

export const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.number(),
  deviceId: z.number(),
  expiresAt: z.string(),
  createdAt: z.string(),
})

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string(),
  })
  .strict()

export const RefreshTokenResSchema = LoginResSchema

export const LogoutBodySchema = RefreshTokenBodySchema

export const GoogleUrlState = z.object({
  userAgent: z.string(),
  userIp: z.string(),
})

export const FacebookUrlState = z.object({
  userAgent: z.string().optional(),
  userIp: z.string().optional(),
})

export const GetGoogleLinkResSchema = z.object({
  url: z.string(),
})

export const ForgotPasswordBodySchema = z.object({
  email: z.string().email(),
})

export const ResetPasswordBodySchema = z
  .object({
    resetToken: z.string(),
    newPassword: z.string().min(6).max(100),
    confirmNewPassword: z.string().min(6).max(100),
  })
  .strict()
  .superRefine(({ newPassword, confirmNewPassword }, ctx) => {
    if (newPassword !== confirmNewPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'New password and confirm new password must match',
        path: ['confirmPassword'],
      })
    }
  })

export const DisabledTwoFactorBodySchema = z
  .object({
    totpCode: z.string().length(6).optional(),
    code: z.string().length(6).optional(),
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    const message = '2FA code or OTP code must be provided. However, you are just allowed to provide one'
    if ((totpCode !== undefined) === (code !== undefined)) {
      ctx.addIssue({
        code: 'custom',
        message,
        path: ['totpCode'],
      })
      ctx.addIssue({
        code: 'custom',
        message,
        path: ['code'],
      })
    }
  })

export const TwoFactorSetupResSchema = z.object({
  uri: z.string(),
  secret: z.string(),
})

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>
export type RegisterResType = z.infer<typeof RegisterResSchema>

export type LoginBodyType = z.infer<typeof LoginBodySchema>
export type LoginResType = z.infer<typeof LoginResSchema>

export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>
export type RefreshTokenResType = LoginResType

export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>

export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>

export type DeviceBodyType = z.infer<typeof DeviceBodySchema>

export type LogoutBodyType = RefreshTokenBodyType

export type GoogleUrlStateType = z.infer<typeof GoogleUrlState>
export type FacebookUrlStateType = z.infer<typeof FacebookUrlState>

export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>
export type ResetPasswordBodyType = z.infer<typeof ResetPasswordBodySchema>

export type DisabledTwoFactorType = z.infer<typeof DisabledTwoFactorBodySchema>
export type TwoFactorSetupResType = z.infer<typeof TwoFactorSetupResSchema>
