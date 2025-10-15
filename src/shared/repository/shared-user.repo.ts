import { Injectable } from '@nestjs/common'
import { RoleType } from 'src/shared/models/shared-role.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services'

export type WhereUserType = { id: number } | { email: string }

// export type GetUserIncRolePermissionsType = UserType & { role: RoleType & { permissions: PermissionType[] } }

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
}
