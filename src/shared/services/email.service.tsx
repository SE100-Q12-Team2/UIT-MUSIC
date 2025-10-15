import * as React from 'react'
import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from 'src/shared/config'
import OTPVerificationEmail from 'emails/otp'
import { TypeOfVerificationCodeType } from 'src/shared/types/auth.type'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  private getEmailTemplate({
    type,
    code,
    username,
    resetPasswordToken,
  }: {
    type: TypeOfVerificationCodeType
    code?: string
    username?: string
    resetPasswordToken?: string
  }) {
    switch (type) {
      case 'REGISTER':
        return {
          subject: 'Verify your account registration',
          template: <OTPVerificationEmail validationCode={code} />,
        }
      // case 'FORGOT_PASSWORD':
      //   return {
      //     subject: 'Reset your password',
      //     template: (
      //       <ResetPasswordEmail
      //         userName={username}
      //         resetUrl={`${envConfig.RESET_PASSWORD_REDIRECT_URL}?token=${resetPasswordToken}`}
      //       />
      //     ),
      //   }
      default:
        return {
          subject: 'Verify your account registration',
          template: <OTPVerificationEmail validationCode={code} />,
        }
    }
  }

  async sendOTP(payload: {
    email: string
    code?: string
    type?: TypeOfVerificationCodeType
    username?: string
    resetPasswordToken?: string
  }) {
    const { subject, template } = this.getEmailTemplate({
      type: payload.type || TypeOfVerificationCode.REGISTER,
      code: payload.code,
      username: payload.username,
      resetPasswordToken: payload.resetPasswordToken,
    })

    return await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: `${payload.email}`,
      subject: subject,
      react: template,
    })
  }
}
