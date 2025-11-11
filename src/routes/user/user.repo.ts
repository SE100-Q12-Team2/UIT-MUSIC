import { Injectable } from '@nestjs/common'
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
import { PrismaService } from 'src/shared/services'
import { Prisma } from '@prisma/client'
import { UserRole, UserRoleEnum } from 'src/shared/constants/user.constant'
import { RoleId } from 'src/shared/constants/role.constant'

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(data: CreateUserBodyType, creatorId: number): Promise<UserResponseType> {
    return await this.prismaService.user.create({
      data: {
        ...data,
        createdById: creatorId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        dateOfBirth: true,
        gender: true,
        accountStatus: true,
        roleId: true,
        createdById: true,
        updatedById: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findUsers(query: GetUsersQueryType): Promise<PaginatedUsersResponseType> {
    const skip = (query.page - 1) * query.limit

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.status) {
      where.accountStatus = query.status
    }

    if (query.role) {
      switch (query.role) {
        case UserRole.Admin:
          where.role = {
            id: RoleId.admin,
          }
          break
        case UserRole.Label:
          where.role = {
            id: RoleId.label,
          }
          break
        case UserRole.Listener:
          where.role = {
            id: RoleId.listener,
          }
          break
        default:
          break
      }
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.user.count({ where }),
      this.prismaService.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          dateOfBirth: true,
          gender: true,
          accountStatus: true,
          roleId: true,
          createdById: true,
          updatedById: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    return {
      data,
      totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(totalItems / query.limit),
    }
  }

  async findUserById(id: number): Promise<UserResponseType | null> {
    return await this.prismaService.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        dateOfBirth: true,
        gender: true,
        accountStatus: true,
        roleId: true,
        createdById: true,
        updatedById: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findUserDetailById(id: number): Promise<UserDetailResponseType | null> {
    return await this.prismaService.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        dateOfBirth: true,
        gender: true,
        accountStatus: true,
        roleId: true,
        createdById: true,
        updatedById: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })
  }

  async updateUser(id: number, data: UpdateUserType, userId: number): Promise<UserResponseType> {
    return await this.prismaService.user.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        ...data,
        updatedById: userId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        dateOfBirth: true,
        gender: true,
        accountStatus: true,
        roleId: true,
        createdById: true,
        updatedById: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async updateUserStatus(id: number, data: UpdateUserStatusType, userId: number): Promise<UserResponseType> {
    return await this.prismaService.user.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        accountStatus: data.accountStatus,
        updatedById: userId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        dateOfBirth: true,
        gender: true,
        accountStatus: true,
        roleId: true,
        createdById: true,
        updatedById: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async updateUserRole(id: number, data: UpdateUserRoleType, userId: number): Promise<UserResponseType> {
    return await this.prismaService.user.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        roleId: data.roleId,
        updatedById: userId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        dateOfBirth: true,
        gender: true,
        accountStatus: true,
        roleId: true,
        createdById: true,
        updatedById: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async deleteUser(id: number, userId: number, isHard = false) {
    if (isHard) {
      return await this.prismaService.user.delete({
        where: {
          id,
          deletedAt: null,
        },
      })
    }

    return await this.prismaService.user.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    })
  }

  async getUserStatistics(userId: number): Promise<UserStatisticsResponseType> {
    const [totalPlaylists, totalFavorites, totalFollows, listeningHistory, activeSubscription] = await Promise.all([
      this.prismaService.playlist.count({
        where: { userId },
      }),
      this.prismaService.favorite.count({
        where: { userId },
      }),
      this.prismaService.follow.count({
        where: { userId },
      }),
      this.prismaService.listeningHistory.aggregate({
        where: { userId },
        _sum: { durationListened: true },
      }),
      this.prismaService.userSubscription.findFirst({
        where: {
          userId,
          isActive: true,
          endDate: {
            gte: new Date(),
          },
        },
      }),
    ])

    const totalListeningSeconds = listeningHistory._sum?.durationListened || 0
    const totalListeningHours = Math.round((totalListeningSeconds / 3600) * 100) / 100

    return {
      totalPlaylists,
      totalFavorites,
      totalFollows,
      totalListeningHours,
      activeSubscription: !!activeSubscription,
    }
  }
}
