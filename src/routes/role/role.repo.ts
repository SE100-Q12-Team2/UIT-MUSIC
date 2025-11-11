import { BadRequestException, Injectable } from '@nestjs/common'
import {
  CreateRoleBodyType,
  GetRoleQueryType,
  GetRoleResType,
  RoleWithPermissionType,
  UpdateRoleBodyType,
} from 'src/routes/role/role.model'
import { RoleType } from 'src/shared/models/shared-role.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class RoleRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAllRoles(query: GetRoleQueryType): Promise<GetRoleResType> {
    const skip = (query.page - 1) * query.limit

    const [totalItems, data] = await Promise.all([
      this.prismaService.role.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.role.findMany({
        where: {
          deletedAt: null,
        },
        skip,
        take: query.limit,
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

  async findRole(id: number): Promise<RoleWithPermissionType | null> {
    return await this.prismaService.role.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: {
          where: {
            deletedAt: null,
          },
        },
      },
    })
  }

  async createRole({ data, userId }: { data: CreateRoleBodyType; userId: number }): Promise<RoleType> {
    return await this.prismaService.role.create({
      data: {
        ...data,
        createdById: userId,
      },
    })
  }

  async updateRole({ data, id, userId }: { id: number; data: UpdateRoleBodyType; userId: number }): Promise<RoleType> {
    if (data.permissionIds.length > 0) {
      const permissions = await this.prismaService.permission.findMany({
        where: {
          id: {
            in: data.permissionIds,
          },
        },
      })

      const existingPermissionIds = permissions.map((p) => p.id)
      const invalidPermissionIds = data.permissionIds.filter((id) => !existingPermissionIds.includes(id))
      if (invalidPermissionIds.length > 0) {
        throw new BadRequestException(`Permissions with ids ${invalidPermissionIds.join(', ')} do not exist`)
      }

      const deletedPermissions = permissions.filter((permission) => permission.deletedAt)
      if (deletedPermissions.length > 0) {
        const deletedIds = deletedPermissions.map((permission) => permission.id)
        throw new BadRequestException(`Permissions with ids ${deletedIds} have already been deleted`)
      }
    }

    return await this.prismaService.role.update({
      where: {
        id: id,
        deletedAt: null,
      },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        permissions: {
          set: data.permissionIds.map((id) => ({ id })),
        },
        updatedById: userId,
      },
      include: {
        permissions: {
          where: {
            deletedAt: null,
          },
        },
      },
    })
  }

  async deleteRole({ id, userId }: { id: number; userId: number }, isHard?: boolean) {
    return isHard
      ? await this.prismaService.role.delete({
          where: {
            id,
            deletedAt: null,
          },
        })
      : await this.prismaService.role.update({
          where: {
            id,
            deletedAt: null,
            isDeleted: true,
          },
          data: {
            deletedAt: new Date(),
            deletedById: userId,
          },
        })
  }
}
