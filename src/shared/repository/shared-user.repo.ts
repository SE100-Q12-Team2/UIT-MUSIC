import { Injectable } from '@nestjs/common'
import { PermissionType } from 'src/routes/permission/permission.model'
import { RoleType } from 'src/shared/models/shared-role.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services'

export type WhereUserType = { id: number } | { email: string }

export type GetUserIncRolePermissionsType = UserType & { role: RoleType & { permissions: PermissionType[] } }

@Injectable()
export class SharedUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUnique(where: WhereUserType): Promise<UserType | null> {
    return await this.prismaService.user.findFirst({
      where: {
        ...where,
        deletedAt: null,
      },
    })
  }

  async findUniqueIncRolePermissions(where: WhereUserType): Promise<GetUserIncRolePermissionsType | null> {
    const user = await this.prismaService.user.findFirst({
      where: {
        ...where,
        deletedAt: null,
      },
      include: {
        role: {
          include: {
            permissions: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    })
    if (!user) return null
    return {
      ...user,
      role: {
        ...user.role,
        permissions: user.role.permissions.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
        })),
      },
    }
  }

  async updateProfile({
    where,
    data,
  }: {
    where: { id: number }
    data: Partial<UserType>
  }): Promise<Omit<UserType, 'totpSecret' | 'password'>> {
    return await this.prismaService.user.update({
      where: {
        ...where,
        deletedAt: null,
      },
      data: {
        ...data,
        updatedById: where.id,
      },
    })
  }
}
