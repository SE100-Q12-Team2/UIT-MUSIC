import { CACHE_MANAGER } from '@nestjs/cache-manager'
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import { Cache } from 'cache-manager'
import { RoleWithPermissionType } from 'src/routes/role/role.model'
import { REQUEST_ROLE_PERMISSION, REQUEST_USER_KEY } from 'src/shared/constants/auth.constant'
import { PrismaService, TokenService } from 'src/shared/services'
import { AccessTokenPayloadReturn } from 'src/shared/types/jwt.type'
import { keyBy } from 'lodash'

type PermissionType = RoleWithPermissionType['permissions'][number]
type CacheRoleType = RoleWithPermissionType & {
  permissions: {
    [key: string]: PermissionType
  }
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async extractAccessToken(request: any): Promise<string> {
    const accessToken = request.headers.authorization?.split(' ')[1] ?? request.cookies?.accessToken

    if (!accessToken) {
      throw new UnauthorizedException('Error.MissingAccessToken')
    }

    return accessToken
  }

  async extractAccessTokenAndValidateAccessToken(request: any): Promise<AccessTokenPayloadReturn> {
    const accessToken = await this.extractAccessToken(request)
    try {
      const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken)
      request[REQUEST_USER_KEY] = decodedAccessToken

      return decodedAccessToken
    } catch {
      throw new UnauthorizedException()
    }
  }

  async validateUserPermissions({
    decodedAccessToken,
    request,
  }: {
    decodedAccessToken: AccessTokenPayloadReturn
    request: any
  }): Promise<void> {
    const roleId = decodedAccessToken.roleId
    const path = request.route.path
    const method = request.method

    // 1. Tạo key cho cache
    const cacheKey = `role:${roleId}`

    // 2. Thử lấy role ra từ cache
    let cachedRole = await this.cacheManager.get<CacheRoleType>(cacheKey)
    console.log(`cachedRole: ${cachedRole}`)

    // 3. Nếu không có trong cache, truy vấn đến db và lưu vào cache
    if (cachedRole === undefined) {
      const role = await this.prismaService.role
        .findUniqueOrThrow({
          where: {
            id: roleId,
            deletedAt: null,
            isActive: true,
          },
          include: {
            permissions: {
              where: {
                deletedAt: null,
              },
            },
          },
        })
        .catch(() => {
          throw new ForbiddenException()
        })

      const permissionsObject = keyBy<PermissionType>(
        role.permissions,
        (permission) => `${permission.path}:${permission.method}`,
      ) as CacheRoleType['permissions']

      cachedRole = {
        ...role,
        permissions: permissionsObject,
      }

      await this.cacheManager.set(cacheKey, cachedRole, 1000 * 60 * 60) // Cache for 1 hour

      request[REQUEST_ROLE_PERMISSION] = cachedRole
    }

    const canAccess: PermissionType | undefined = cachedRole.permissions[`${path}:${method}`]

    if (!canAccess) {
      throw new ForbiddenException('Error.CantAccess')
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const decodedAccessToken = await this.extractAccessTokenAndValidateAccessToken(request)

    await this.validateUserPermissions({ decodedAccessToken, request })

    return true
  }
}
