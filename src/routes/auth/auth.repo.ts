import { Injectable } from '@nestjs/common'
import { DeviceBodyType, RefreshTokenType, RegisterBodyType, VerificationCodeType } from 'src/routes/auth/auth.model'
import { RoleType } from 'src/shared/models/shared-role.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services'
import { TypeOfVerificationCodeType } from 'src/shared/types/auth.type'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findVerificationCode(
    uniqueValue:
      | { id: number }
      | {
          email_type: {
            email: string
            type: TypeOfVerificationCodeType
          }
        },
  ): Promise<VerificationCodeType | null> {
    return await this.prismaService.verificationCode.findUnique({
      where: uniqueValue,
    })
  }

  async createVerificationCode(payload: Pick<VerificationCodeType, 'email' | 'code' | 'type' | 'expiresAt'>) {
    return this.prismaService.verificationCode.upsert({
      where: {
        email_type: {
          email: payload.email,
          type: payload.type,
        },
      },
      create: payload,
      update: {
        code: payload.code,
        expiresAt: payload.expiresAt,
      },
    })
  }

  async deleteVerificationCode(
    uniqueValue:
      | { id: number }
      | {
          email_type: {
            email: string
            type: TypeOfVerificationCodeType
          }
        },
  ): Promise<VerificationCodeType> {
    return await this.prismaService.verificationCode.delete({
      where: uniqueValue,
    })
  }

  async createUser(
    user: Omit<RegisterBodyType, 'confirmPassword' | 'code'> & Pick<UserType, 'roleId'>,
  ): Promise<Omit<UserType, 'password'>> {
    return this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
      },
    })
  }

  async createDevice(
    data: Pick<DeviceBodyType, 'userId' | 'ip' | 'userAgent'> &
      Partial<Pick<DeviceBodyType, 'isActive' | 'lastActive'>>,
  ) {
    return this.prismaService.device.create({
      data,
    })
  }

  async updateDevice(deviceId: number, data: Partial<DeviceBodyType>): Promise<DeviceBodyType> {
    return await this.prismaService.device.update({
      data,
      where: {
        id: deviceId,
      },
    })
  }

  async createRefreshToken(data: { token: string; userId: number; deviceId: number; expiresAt: Date }) {
    return await this.prismaService.refreshToken.create({
      data,
    })
  }

  async findUniqueRefreshTokenIncludeUserRole(
    refreshToken: string,
  ): Promise<(RefreshTokenType & { user: UserType & { role: RoleType } }) | null> {
    return this.prismaService.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  async deleteRefreshToken(token: string): Promise<RefreshTokenType> {
    return await this.prismaService.refreshToken.delete({
      where: {
        token,
      },
    })
  }
}
