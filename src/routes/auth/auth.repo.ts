import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { DeviceBodyType, RefreshTokenType, RegisterBodyType, VerificationCodeType } from 'src/routes/auth/auth.model'
import { RoleType } from 'src/shared/models/shared-role.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { WhereUserType } from 'src/shared/repository/shared-user.repo'
import { PrismaService } from 'src/shared/services'
import { TypeOfVerificationCodeType } from 'src/shared/types/auth.type'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUniqueUserIncludeRole(where: WhereUserType) {
      return this.prismaService.user.findFirst({
        where: {
          ...where,
          deletedAt: null,
        },
        include: {
          role: true,
        },
      })
  }

  async createUserIncludeRole(
    user: Pick<UserType, 'email' | 'fullName' | 'password' | 'profileImage' | 'roleId'>,
  ): Promise<Prisma.UserGetPayload<{ include: { role: true } }>> {
    return this.prismaService.user.create({
      data: user,
      include: {
        role: true,
      },
    })
  }

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
    const code = await this.prismaService.verificationCode.findUnique({
      where: uniqueValue,
    })

    if (!code) return null

    return {
      ...code,
      expiresAt: code.expiresAt.toISOString(),
      createdAt: code.createdAt.toISOString(),
    }
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
    const code = await this.prismaService.verificationCode.delete({
      where: uniqueValue,
    })

    return {
      ...code,
      expiresAt: code.expiresAt.toISOString(),
      createdAt: code.createdAt.toISOString(),
    }
  }

  async createUser(
    user: Omit<RegisterBodyType, 'confirmPassword' | 'code'> & Pick<UserType, 'roleId'>,
  ): Promise<Omit<UserType, 'password'>> {
    const newUser = await this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
      },
    })

    return {
      ...newUser,
      dateOfBirth: newUser.dateOfBirth ? newUser.dateOfBirth.toISOString() : null,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    }
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
    const device = await this.prismaService.device.update({
      data,
      where: {
        id: deviceId,
      },
    })

    return {
      ...device,
      lastActive: device.lastActive.toISOString(),
      createdAt: device.createdAt.toISOString(),
    }
  }

  async createRefreshToken(data: { token: string; userId: number; deviceId: number; expiresAt: Date }) {
    return await this.prismaService.refreshToken.create({
      data,
    })
  }

  async findUniqueRefreshTokenIncludeUserRole(
    refreshToken: string,
  ): Promise<(RefreshTokenType & { user: UserType & { role: RoleType } }) | null> {
    const token = await this.prismaService.refreshToken.findUnique({
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

    if (!token) return null

    return {
      ...token,
      expiresAt: token.expiresAt.toISOString(),
      createdAt: token.createdAt.toISOString(),
      user: {
        ...token.user,
        dateOfBirth: token.user.dateOfBirth ? token.user.dateOfBirth.toISOString() : null,
        createdAt: token.user.createdAt.toISOString(),
        updatedAt: token.user.updatedAt.toISOString(),
        role: {
          ...token.user.role,
          deletedAt: token.user.role.deletedAt ? token.user.role.deletedAt.toISOString() : null,
          createdAt: token.user.role.createdAt.toISOString(),
          updatedAt: token.user.role.updatedAt.toISOString(),
        },
      },
    }
  }

  async deleteRefreshToken(token: string): Promise<RefreshTokenType> {
    const refreshToken = await this.prismaService.refreshToken.delete({
      where: {
        token,
      },
    })

    return {
      ...refreshToken,
      expiresAt: refreshToken.expiresAt.toISOString(),
      createdAt: refreshToken.createdAt.toISOString(),
    }
  }

  async deleteRefreshTokenByUserId(userId: number) {
    return await this.prismaService.refreshToken.deleteMany({
      where: {
        userId,
      },
    })
  }
}
