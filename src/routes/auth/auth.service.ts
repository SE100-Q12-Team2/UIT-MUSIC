import { Injectable } from '@nestjs/common'
import { EmailAlreadyExistException, EmailNotExistException, ExpiredOTPException, InvalidOTPException, OTPFailedException } from 'src/routes/auth/auth.error'
import { ForgotPasswordBodyType, LoginBodyType, RegisterBodyType, SendOTPBodyType } from 'src/routes/auth/auth.model'
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

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly sharedRoleRepo: SharedRoleRepository,
    private readonly sharedUserRepo: SharedUserRepository,
  ) {}

  async generateTokens({ userId, roleId, roleName }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({
        userId,
      }),
    ])

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepository.createRefreshToken({
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

    if (verificationCode?.code !== code) {
      throw InvalidOTPException
    }

    if (!verificationCode) {
      throw InvalidOTPException
    }

    if (verificationCode && verificationCode.expiresAt < new Date()) {
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
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)),
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

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {}

  async logout(token: string) {}

  async forgotPassword(forgotPasswordBody: ForgotPasswordBodyType) {}
}
