import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'

export const emailMessages = {
  [TypeOfVerificationCode.REGISTER]: 'Registration verification code sent successfully',
  [TypeOfVerificationCode.FORGOT_PASSWORD]: 'Password reset code sent successfully',
  [TypeOfVerificationCode.LOGIN]: 'Login verification code sent successfully',
  [TypeOfVerificationCode.DISABLED_2FA]: '2FA disable verification code sent successfully',
}
