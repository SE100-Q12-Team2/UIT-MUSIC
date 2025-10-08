import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'

export const InvalidOTPException = new UnprocessableEntityException([
  {
    path: 'code',
    message: 'Error.InvalidOTP',
  },
])

export const ExpiredOTPException = new UnprocessableEntityException([
  {
    path: 'code',
    message: 'Mã OTP đã hết hạn',
  },
])

export const EmailAlreadyExistException = new UnprocessableEntityException([
  {
    message: 'Email already exists ',
    path: 'email',
  },
])

export const OTPFailedException = new UnprocessableEntityException([
  {
    path: 'code',
    message: 'Failed to send OTP code',
  },
])

export const EmailNotExistException = new UnprocessableEntityException([
  {
    message: 'Email does not exist',
    path: 'email',
  },
])

export const InvalidResetTokenException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidResetToken or Error.ExpiredResetToken',
    path: 'resetToken',
  },
])

export const InvalidRefreshTokenException = new UnauthorizedException('Refresh token is not valid')

export const RevokedRefreshTokenException = new UnauthorizedException('Refresh token has been used')

export const TOTPAlreadyEnabledException = new UnprocessableEntityException([
  {
    message: 'Error.TOTPAlreadyEnabled',
    path: 'totpCode',
  },
])

export const TOTPNotEnabledException = new UnprocessableEntityException([
  {
    message: 'Error.TOTPNotEnabled',
    path: 'totpCode',
  },
])

export const TOTPNotValidException = new UnprocessableEntityException([
  {
    message: 'Error.TOTPNotValid',
    path: 'totpCode',
  },
])
