import { Injectable, UnprocessableEntityException } from '@nestjs/common'
import {
  EmailAlreadyExistException,
  EmailNotExistException,
  ExpiredOTPException,
  InvalidOTPException,
  InvalidResetTokenException,
  OTPFailedException,
  RevokedRefreshTokenException,
} from 'src/routes/auth/auth.error'
import {
  ForgotPasswordBodyType,
  LoginBodyType,
  RegisterBodyType,
  ResetPasswordBodyType,
  SendOTPBodyType,
} from 'src/routes/auth/auth.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { SharedRoleRepository } from 'src/shared/repository/shared-role.repo'
import { SharedUserRepository } from 'src/shared/repository/shared-user.repo'
import { HashingService } from 'src/shared/services'
import { TokenService } from 'src/shared/services/token.service'
import { TypeOfVerificationCodeType } from 'src/shared/types/auth.type'
import { generateOTP } from '../../shared/helpers'
import envConfig from 'src/shared/config'
import { addMilliseconds } from 'date-fns'
import ms, { StringValue } from 'ms'
import { EmailService } from 'src/shared/services/email.service'
import { emailMessages } from 'src/shared/constants/email.constant'
import { SharedResetPasswordTokenRepo } from 'src/shared/repository/shared-reset-password-token.repo'

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly sharedRoleRepo: SharedRoleRepository,
    private readonly sharedUserRepo: SharedUserRepository,
    private readonly sharedResetPasswordTokenRepo: SharedResetPasswordTokenRepo,
    private readonly emailService: EmailService,
  ) {}

  async generateTokens({ userId, deviceId, roleId, roleName }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({
        userId,
      }),
    ])

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepository.createRefreshToken({
      deviceId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
      token: refreshToken,
      userId,
    })

    return { accessToken, refreshToken }
  }

  async validateVerificationCode({
    code,
    email,
    type,
  }: {
    code: string
    email: string
    type: TypeOfVerificationCodeType
  }) {
    const verificationCode = await this.authRepository.findVerificationCode({
      email_type: {
        email,
        type,
      },
    })

    if (!verificationCode) {
      throw InvalidOTPException
    }

    if (verificationCode?.code !== code) {
      throw InvalidOTPException
    }

    if (verificationCode && new Date(verificationCode.expiresAt) < new Date()) {
      throw ExpiredOTPException
    }

    return verificationCode
  }

  async sendOTP(body: SendOTPBodyType) {
    const user = await this.sharedUserRepo.findUnique({
      email: body.email,
    })

    if (body.type === TypeOfVerificationCode.REGISTER && user) {
      throw EmailAlreadyExistException
    }

    if (body.type === TypeOfVerificationCode.FORGOT_PASSWORD && !user) {
      throw EmailNotExistException
    }

    const code = generateOTP()
    await this.authRepository.createVerificationCode({
      code,
      email: body.email,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)).toISOString(),
    })

    const { error } = await this.emailService.sendOTP({
      code,
      email: body.email,
      type: body.type,
      username: user?.fullName,
    })

    if (error) {
      console.log('OTP error', error)

      throw OTPFailedException
    }

    return {
      message: emailMessages[body.type] || 'Send OTP code successfully',
    }
  }

  async register(body: RegisterBodyType) {
    try {
      await this.validateVerificationCode({
        code: body.code,
        email: body.email,
        type: TypeOfVerificationCode.REGISTER,
      })

      const listenerRoleId = await this.sharedRoleRepo.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)

      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          fullName: body.fullName,
          password: hashedPassword,
          roleId: listenerRoleId,
        }),
        this.authRepository.deleteVerificationCode({
          email_type: {
            email: body.email,
            type: TypeOfVerificationCode.REGISTER,
          },
        }),
      ])
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyExistException
      }
      throw error
    }
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    try {
      const user = await this.sharedUserRepo.findUniqueIncRolePermissions({
        email: body.email,
      })

      if (!user) {
        throw EmailNotExistException
      }

      const isPasswordCorrect = await this.hashingService.compare(body.password, user.password)

      if (!isPasswordCorrect) {
        throw new UnprocessableEntityException([
          {
            message: 'Password is not correct',
            path: 'password',
          },
        ])
      }

      const device = await this.authRepository.createDevice({
        userId: user.id,
        ip: body.ip,
        userAgent: body.userAgent,
      })

      const tokens = await this.generateTokens({
        deviceId: device.id,
        roleId: user.roleId,
        userId: user.id,
        roleName: user.role.name,
      })

      return tokens
    } catch (error) {
      throw error
    }
  }

  async logout(token: string) {
    await this.tokenService.verifyRefreshToken(token)

    const refreshToken = await this.authRepository.findUniqueRefreshTokenIncludeUserRole(token)

    if (!refreshToken) {
      throw RevokedRefreshTokenException
    }

    const { deviceId } = refreshToken

    const $updateDeviceStatus = this.authRepository.updateDevice(deviceId, {
      isActive: false,
    })

    const $deleteRefreshToken = this.authRepository.deleteRefreshToken(token)

    await Promise.all([$updateDeviceStatus, $deleteRefreshToken])

    return { message: 'Logout successfully' }
  }

  async forgotPassword(forgotPasswordBody: ForgotPasswordBodyType) {
    try {
      const user = await this.sharedUserRepo.findUnique({
        email: forgotPasswordBody.email,
      })

      if (!user) {
        throw EmailNotExistException
      }

      await this.sharedResetPasswordTokenRepo.deleteExistingResetTokens(user.id)

      const resetPasswordToken = await this.tokenService.signResetPasswordToken({
        userId: user.id,
        email: user.email,
      })

      const decodedResetPasswordToken = await this.tokenService.verifyResetPasswordToken(resetPasswordToken)
      const expMs = decodedResetPasswordToken?.exp
        ? decodedResetPasswordToken.exp * 1000
        : Date.now() + ms(envConfig.RESET_PASSWORD_TOKEN_EXPIRES_IN as StringValue)

      await this.sharedResetPasswordTokenRepo.createResetToken({
        token: resetPasswordToken,
        userId: user.id,
        expiresAt: new Date(expMs).toISOString(),
      })

      await this.emailService.sendOTP({
        email: user.email,
        type: TypeOfVerificationCode.FORGOT_PASSWORD,
        username: user.fullName,
        resetPasswordToken,
      })

      return {
        message: "Reset password link's been sent to your email",
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  async resetPasswordWithToken(body: ResetPasswordBodyType) {
    try {
      await this.tokenService.verifyResetPasswordToken(body.resetToken)

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('error token', error)
      throw InvalidResetTokenException
    }

    const resetToken = await this.sharedResetPasswordTokenRepo.findResetPasswordToken(body.resetToken)

    if (!resetToken) {
      throw InvalidResetTokenException
    }

    if (resetToken.expiresAt.getTime() <= Date.now()) {
      console.log('resetToken.expiresAt', resetToken.expiresAt, 'now', new Date())
      throw InvalidResetTokenException
    }

    const user = await this.sharedUserRepo.findUnique({
      id: resetToken.userId,
    })

    if (!user) {
      throw EmailNotExistException
    }

    const hashedPassword = await this.hashingService.hash(body.newPassword)

    await Promise.all([
      this.sharedUserRepo.updateProfile({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
          updatedById: user.id,
        },
      }),
      this.sharedResetPasswordTokenRepo.deleteResetPasswordToken(body.resetToken),
      this.authRepository.deleteRefreshTokenByUserId(user.id),
    ])

    return { message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập lại' }
  }
}
