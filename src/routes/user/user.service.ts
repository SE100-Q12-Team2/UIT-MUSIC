import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'
import {
  CreateUserBodyType,
  GetUsersQueryType,
  PaginatedUsersResponseType,
  UpdateUserRoleType,
  UpdateUserStatusType,
  UpdateUserType,
  UserDetailResponseType,
  UserResponseType,
  UserStatisticsResponseType,
} from './user.model'
import { UserRepository } from './user.repo'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/lib'
import { CannotDeleteSelfException, UserAlreadyExistException, UserNotFoundException } from './user.error'
import { HashingService } from 'src/shared/services'

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashingService: HashingService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createUser(data: CreateUserBodyType, creatorId: number): Promise<UserResponseType> {
    try {
      const hashedPassword = await this.hashingService.hash(data.password)

      const newUser = await this.userRepository.createUser(
        {
          ...data,
          password: hashedPassword,
        },
        creatorId,
      )

      return newUser
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw UserAlreadyExistException
      }
      throw error
    }
  }

  async getUsers(query: GetUsersQueryType): Promise<PaginatedUsersResponseType> {
    return await this.userRepository.findUsers(query)
  }

  async getUserById(id: number): Promise<UserResponseType> {
    const user = await this.userRepository.findUserById(id)

    if (!user) {
      throw UserNotFoundException
    }

    return user
  }

  async getUserDetailById(id: number): Promise<UserDetailResponseType> {
    const user = await this.userRepository.findUserDetailById(id)

    if (!user) {
      throw UserNotFoundException
    }

    return user
  }

  async updateUser(id: number, data: UpdateUserType): Promise<UserResponseType> {
    try {
      const updatedUser = await this.userRepository.updateUser(id, data, id)

      await this.cacheManager.del(`user:${id}`)

      return updatedUser
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw UserNotFoundException
      }
      throw error
    }
  }

  async updateUserStatus(id: number, data: UpdateUserStatusType): Promise<UserResponseType> {
    try {
      const updatedUser = await this.userRepository.updateUserStatus(id, data, id)

      await this.cacheManager.del(`user:${id}`)

      return updatedUser
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw UserNotFoundException
      }
      throw error
    }
  }

  async updateUserRole(id: number, data: UpdateUserRoleType): Promise<UserResponseType> {
    try {
      const updatedUser = await this.userRepository.updateUserRole(id, data, id)

      await this.cacheManager.del(`user:${id}`)

      return updatedUser
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw UserNotFoundException
      }
      throw error
    }
  }

  async deleteUser(id: number, activeUserId: number): Promise<void> {
    if (id === activeUserId) {
      throw CannotDeleteSelfException
    }

    try {
      await this.userRepository.deleteUser(id, activeUserId)

      await this.cacheManager.del(`user:${id}`)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw UserNotFoundException
      }
      throw error
    }
  }

  async getUserStatistics(userId: number): Promise<UserStatisticsResponseType> {
    await this.getUserById(userId)

    return await this.userRepository.getUserStatistics(userId)
  }
}
