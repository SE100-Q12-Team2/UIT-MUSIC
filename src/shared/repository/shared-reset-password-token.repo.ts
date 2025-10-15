import { Injectable } from '@nestjs/common'
import { CreateResetTokenBodyType } from 'src/shared/models/shared-reset-password-token.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class SharedResetPasswordTokenRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async createResetToken({ token, userId, expiresAt }: CreateResetTokenBodyType) {
    return await this.prismaService.resetPasswordToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    })
  }

  async findResetPasswordToken(token: string) {
    return await this.prismaService.resetPasswordToken.findUnique({
      where: { token },
    })
  }

  async deleteResetPasswordToken(token: string) {
    return await this.prismaService.resetPasswordToken.delete({
      where: { token },
    })
  }

  async deleteExistingResetTokens(userId: number) {
    return await this.prismaService.resetPasswordToken.deleteMany({
      where: { userId },
    })
  }
}
