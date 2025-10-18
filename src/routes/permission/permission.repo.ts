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
      data,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  async findOnePermission({ id }: GetPermissionParamType): Promise<PermissionType | null> {
    return await this.prismaService.permission.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    })
  }

  async createPermission({
    data,
    userId,
  }: {
    data: CreatePermissionBodyType
    userId: number
  }): Promise<PermissionType> {
    return await this.prismaService.permission.create({
      data: {
        ...data,
        createdById: userId,
      },
    })
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
    return await this.prismaService.permission.update({
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
  }

  async deletePermission({ permissionId, userId }: { permissionId: number; userId: number }, isHard?: boolean) : Promise<PermissionType & { roles: RoleType[] }> {
    return isHard
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
  }
}
