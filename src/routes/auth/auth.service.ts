import { Injectable } from '@nestjs/common'
import { ForgotPasswordBodyType, LoginBodyType, RegisterBodyType, SendOTPBodyType } from 'src/routes/auth/auth.model'

@Injectable()
export class AuthService {
  constructor() {}

  async register(body: RegisterBodyType) {}

  async sendOTP(body: SendOTPBodyType) {}

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {}

  async logout(token: string) {}

  async forgotPassword(forgotPasswordBody: ForgotPasswordBodyType) {}
}
