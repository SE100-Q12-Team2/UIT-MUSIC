import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'
import {
  ProhibitedActionOnBaseRoleException,
  RoleAlreadyExistException,
  RoleNotFoundException,
} from 'src/routes/role/role.error'
import { CreateRoleBodyType, GetRoleQueryType, UpdateRoleBodyType } from 'src/routes/role/role.model'
import { RoleRepository } from 'src/routes/role/role.repo'
import { Role } from 'src/shared/constants/role.constant'
import { NotFoundRecordException } from 'src/shared/error'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/lib'

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async verifyRole(roleId: number) {
    const role = await this.roleRepository.findRole(roleId)
    if (!role) {
      throw NotFoundRecordException
    }

    const baseRoles: string[] = [Role.ADMIN, Role.CLIENT, Role.SELLER]
    if (baseRoles.includes(role.name)) {
      throw ProhibitedActionOnBaseRoleException
    }
  }

  async create({ data, userId }: { data: CreateRoleBodyType; userId: number }) {
    try {
      return await this.roleRepository.createRole({
        data,
        userId,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistException
      }
    }
  }

  async findAll(query: GetRoleQueryType) {
    return await this.roleRepository.findAllRoles(query)
  }

  async findOne({ id }: { id: number }) {
    const role = await this.roleRepository.findRole(id)

    if (!role) {
      throw RoleNotFoundException
    }

    return role
  }

  async update({ data, id, userId }: { id: number; data: UpdateRoleBodyType; userId: number }) {
    try {
      await this.verifyRole(id)

      const updatedRole = await this.roleRepository.updateRole({
        data,
        id,
        userId,
      })

      await this.cacheManager.del(`role: ${updatedRole.id}`)

      return updatedRole
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw RoleNotFoundException
      }
      throw error
    }
  }

  async remove({ id, userId }: { id: number; userId: number }) {
    try {
      await this.verifyRole(id)

      const role = await this.roleRepository.deleteRole({
        id,
        userId,
      })

      await this.cacheManager.del(`role: ${role.id}`)

      return {
        message: 'Delete role successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
    }
  }
}
