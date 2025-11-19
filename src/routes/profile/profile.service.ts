import { Injectable } from '@nestjs/common'
import { ChangePasswordBodyType, UpdateProfileBodyType } from 'src/routes/profile/profile.model'
import { InvalidPasswordException, NotFoundRecordException } from 'src/shared/errors'
import { isNotFoundPrismaError } from 'src/shared/lib'
import { SharedUserRepository } from 'src/shared/repository/shared-user.repo'
import { HashingService } from 'src/shared/services'

@Injectable()
export class ProfileService {
  constructor(
    private readonly shareUserRepo: SharedUserRepository,
    private readonly hashingService: HashingService,
  ) {}

  async getProfile(id: number) {
    const profile = await this.shareUserRepo.findUniqueIncRolePermissions({ id })

    if (!profile) {
      throw NotFoundRecordException
    }
    return profile
  }

  async updateProfile({ userId, body }: { userId: number; body: UpdateProfileBodyType }) {
    try {
      const { dateOfBirth, ...restBody } = body
      const updateData = {
        ...restBody,
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      }

      return await this.shareUserRepo.updateProfile({
        where: {
          id: userId,
        },
        data: updateData,
      })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
    }
  }

  async changePassword({ userId, data }: { userId: number; data: Omit<ChangePasswordBodyType, 'confirmPasswords'> }) {
    try {
      const { newPassword, password } = data

      const user = await this.shareUserRepo.findUnique({
        id: userId,
      })

      if (!user) {
        throw NotFoundRecordException
      }

      const isPasswordMatch = await this.hashingService.compare(password, user.password)

      if (!isPasswordMatch) {
        throw InvalidPasswordException
      }

      const hashedPassword = await this.hashingService.hash(newPassword)

      await this.shareUserRepo.updateProfile({
        where: {
          id: userId,
        },
        data: {
          password: hashedPassword,
          updatedById: userId,
        },
      })

      return {
        message: 'Change password successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}
