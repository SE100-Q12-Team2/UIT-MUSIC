import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { PermissionAlreadyExist } from 'src/routes/permission/permission.error'
import {
  CreatePermissionBodyType,
  GetPermissionParamType,
  GetPermissionQueryType,
  UpdatePermissionBodyType,
} from 'src/routes/permission/permission.model'
import { PermissionRepository } from 'src/routes/permission/permission.repo'
import { NotFoundRecordException } from 'src/shared/errors'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/lib'
import { RoleType } from 'src/shared/models/shared-role.model'

@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepo: PermissionRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAllPermissions({ limit, page }: GetPermissionQueryType) {
    return await this.permissionRepo.findAllPermissions({
      page,
      limit,
    })
  }

  async findOnePermission(id: GetPermissionParamType) {
    const permission = await this.permissionRepo.findOnePermission(id)

    if (!permission) {
      throw NotFoundRecordException
    }

    return permission
  }

  async createPermission({ data, userId }: { data: CreatePermissionBodyType; userId: number }) {
    try {
      return await this.permissionRepo.createPermission({
        data,
        userId,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw PermissionAlreadyExist
      }
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
  }) {
    try {
      const permissions = await this.permissionRepo.updatePermission({
        permissionId,
        data,
        userId,
      })

      await this.deleteCacheRoles(permissions.roles)

      return permissions
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
    }
  }

  async deletePermission({ permissionId, userId }: { permissionId: number; userId: number }) {
    try {
      const permissions = await this.permissionRepo.deletePermission({
        permissionId,
        userId,
      })

      await this.deleteCacheRoles(permissions.roles)

      return {
        message: 'Delete permission successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
    }
  }

  async deleteCacheRoles(roles: RoleType[]) {
    return await Promise.all(roles.map((role) => this.cacheManager.del(`role:${role.id}`)))
  }
}
