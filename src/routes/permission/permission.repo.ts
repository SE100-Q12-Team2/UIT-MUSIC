import { Injectable } from '@nestjs/common'
import {
  CreatePermissionBodyType,
  GetPermissionParamType,
  GetPermissionQueryType,
  GetPermissionResType,
  PermissionType,
  UpdatePermissionBodyType,
} from 'src/routes/permission/permission.model'
import { RoleType } from 'src/shared/models/shared-role.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class PermissionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAllPermissions({ limit, page }: GetPermissionQueryType): Promise<GetPermissionResType> {
    const skip = (page - 1) * limit

    const [totalItems, data] = await Promise.all([
      this.prismaService.permission.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.permission.findMany({
        where: {
          deletedAt: null,
        },
        skip,
        take: limit,
      }),
    ])

    return {
      data: data.map((permission) => ({
        ...permission,
        createdAt: permission.createdAt.toISOString(),
        updatedAt: permission.updatedAt.toISOString(),
        deletedAt: permission.deletedAt ? permission.deletedAt.toISOString() : null,
      })),
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  async findOnePermission({ id }: GetPermissionParamType): Promise<PermissionType | null> {
    const permission = await this.prismaService.permission.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    })
    if (!permission) return null
    return {
      ...permission,
      createdAt: permission.createdAt.toISOString(),
      updatedAt: permission.updatedAt.toISOString(),
      deletedAt: permission.deletedAt ? permission.deletedAt.toISOString() : null,
    }
  }

  async createPermission({
    data,
    userId,
  }: {
    data: CreatePermissionBodyType
    userId: number
  }): Promise<PermissionType> {
    const permission = await this.prismaService.permission.create({
      data: {
        ...data,
        createdById: userId,
      },
    })
    return {
      ...permission,
      createdAt: permission.createdAt.toISOString(),
      updatedAt: permission.updatedAt.toISOString(),
      deletedAt: permission.deletedAt ? permission.deletedAt.toISOString() : null,
    }
  }

  async updatePermission({
    permissionId,
    data,
    userId,
  }: {
    permissionId: number
    data: UpdatePermissionBodyType
    userId: number
  }): Promise<PermissionType & { roles: RoleType[] }> {
    const permission = await this.prismaService.permission.update({
      where: {
        id: permissionId,
        deletedAt: null,
      },
      data: {
        ...data,
        updatedById: userId,
      },
      include: {
        roles: true,
      },
    })
    return {
      ...permission,
      createdAt: permission.createdAt.toISOString(),
      updatedAt: permission.updatedAt.toISOString(),
      deletedAt: permission.deletedAt ? permission.deletedAt.toISOString() : null,
      roles: permission.roles.map((role) => ({
        ...role,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
        deletedAt: role.deletedAt ? role.deletedAt.toISOString() : null,
      })),
    }
  }

  async deletePermission(
    { permissionId, userId }: { permissionId: number; userId: number },
    isHard?: boolean,
  ): Promise<PermissionType & { roles: RoleType[] }> {
    const permission = isHard
      ? await this.prismaService.permission.delete({
          where: {
            id: permissionId,
          },
          include: {
            roles: true,
          },
        })
      : await this.prismaService.permission.update({
          where: {
            id: permissionId,
            deletedAt: null,
          },
          data: {
            deletedById: userId,
            deletedAt: new Date(),
          },
          include: {
            roles: true,
          },
        })
    return {
      ...permission,
      createdAt: permission.createdAt.toISOString(),
      updatedAt: permission.updatedAt.toISOString(),
      deletedAt: permission.deletedAt ? permission.deletedAt.toISOString() : null,
      roles: permission.roles.map((r) => ({
        ...r,
        deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    }
  }
}
