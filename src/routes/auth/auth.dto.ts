import { createZodDto } from 'nestjs-zod'
import {
  DisabledTwoFactorBodySchema,
  ForgotPasswordBodySchema,
  GetGoogleLinkResSchema,
  LoginBodySchema,
  LoginResSchema,
  LogoutBodySchema,
  RefreshTokenBodySchema,
  RefreshTokenResSchema,
  RegisterBodySchema,
  RegisterResSchema,
  ResetPasswordBodySchema,
  SendOTPBodySchema,
  TwoFactorSetupResSchema,
} from 'src/routes/auth/auth.model'

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}
export class RegisterResDTO extends createZodDto(RegisterResSchema) {}

export class SendOTPBodyDTO extends createZodDto(SendOTPBodySchema) {}

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}
export class LoginResDTO extends createZodDto(LoginResSchema) {}

export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}
export class RefreshTokenResDTO extends createZodDto(RefreshTokenResSchema) {}

export class LogoutBodyDTO extends createZodDto(LogoutBodySchema) {}

export class GetGoogleLinkResDTO extends createZodDto(GetGoogleLinkResSchema) {}

export class ForgotPasswordBodyDTO extends createZodDto(ForgotPasswordBodySchema) {}
export class ResetPasswordBodyDTO extends createZodDto(ResetPasswordBodySchema) {}

export class DisabledTwoFactorBodyDTO extends createZodDto(DisabledTwoFactorBodySchema) {}

export class TwoFactorResSetupDTO extends createZodDto(TwoFactorSetupResSchema) {}
