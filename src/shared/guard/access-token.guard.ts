import { CACHE_MANAGER } from '@nestjs/cache-manager'
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  Logger,
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
  private readonly logger = new Logger(AccessTokenGuard.name)

  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async extractAccessToken(request: any): Promise<string> {
    try {
      this.logger.debug(`Incoming auth header: ${JSON.stringify(request.headers?.authorization)}`)
      this.logger.debug(`Incoming cookies: ${JSON.stringify(request.cookies)}`)
    } catch (err) {
      // ignore circular
    }

    const headerAuth = request.headers?.authorization ?? request.get?.('authorization')
    const cookieToken = request.cookies?.accessToken ?? request.cookies?.access_token ?? request.cookies?.token

    const accessToken = headerAuth?.split(' ')[1] ?? cookieToken

    if (!accessToken) {
      this.logger.warn('Missing access token. headerAuth=' + !!headerAuth + ', cookieToken=' + !!cookieToken)
      throw new UnauthorizedException('Error.MissingAccessToken')
    }

    return accessToken
  }

  async extractAccessTokenAndValidateAccessToken(request: any): Promise<AccessTokenPayloadReturn> {
    const accessToken = await this.extractAccessToken(request)
    try {
      const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken)
      request[REQUEST_USER_KEY] = decodedAccessToken
      this.logger.debug(`Token verified for userId=${decodedAccessToken.userId}, roleId=${decodedAccessToken.roleId}`)
      return decodedAccessToken
    } catch (err) {
      this.logger.error('Failed to verify access token', err as any)
      throw new UnauthorizedException('Error.InvalidAccessToken')
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
    const path = request.route?.path ?? request.url
    const method = request.method

    this.logger.debug(`Checking permissions for roleId=${roleId} on ${method} ${path}`)

    // 1. Tạo key cho cache
    const cacheKey = `role:${roleId}`

    // 2. Thử lấy role ra từ cache
    let cachedRole = await this.cacheManager.get<CacheRoleType>(cacheKey)
    this.logger.debug(`cache lookup for ${cacheKey}: ${cachedRole ? 'HIT' : 'MISS'}`)

    // 3. Nếu không có trong cache, truy vấn đến db và lưu vào cache
    if (!cachedRole) {
      try {
        const role = await this.prismaService.role.findUniqueOrThrow({
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

        const permissionsWithStringDates = role.permissions.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
        }))

        const permissionsObject = keyBy<PermissionType>(
          permissionsWithStringDates,
          (permission) => `${permission.path}:${permission.method}`,
        ) as CacheRoleType['permissions']

        cachedRole = {
          ...role,
          deletedAt: role.deletedAt ? role.deletedAt.toISOString() : null,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString(),
          permissions: permissionsObject,
        }

        // NOTE: many cache-manager stores expect { ttl: seconds }. Use option object for clarity.
        // If your cache manager expects (key, value, ttlNumber) keep previous style.
        // We'll attempt option-object first and fall back to numeric TTL if it errors.
        try {
          await this.cacheManager.set(cacheKey, cachedRole) 
        } catch (e) {
          this.logger.warn('cacheManager.set with options failed, trying numeric TTL', e as any)
          await this.cacheManager.set(cacheKey, cachedRole, 60 * 60)
        }

        request[REQUEST_ROLE_PERMISSION] = cachedRole
        this.logger.debug(`Cached role ${roleId} with ${Object.keys(permissionsObject).length} permissions`)
      } catch (err) {
        this.logger.warn(`Role lookup failed for roleId=${roleId}`, err as any)
        throw new ForbiddenException()
      }
    } else {
      request[REQUEST_ROLE_PERMISSION] = cachedRole
    }

    const permissionKey = `${path}:${method}`
    const canAccess: PermissionType | undefined = cachedRole.permissions?.[permissionKey]

    if (!canAccess) {
      const availableKeys = Object.keys(cachedRole.permissions ?? {}).slice(0, 20)
      this.logger.warn(
        `Access denied for roleId=${roleId} on ${permissionKey}. Available keys (sample): ${availableKeys.join(
          ', ',
        )}`,
      )
      throw new ForbiddenException('Error.CantAccess')
    }

    this.logger.debug(`Access allowed for roleId=${roleId} on ${permissionKey}`)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const decodedAccessToken = await this.extractAccessTokenAndValidateAccessToken(request)

    await this.validateUserPermissions({ decodedAccessToken, request })

    return true
  }
}
