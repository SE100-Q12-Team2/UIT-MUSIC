import { NestFactory } from '@nestjs/core'
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from 'src/app.module'
import { HTTPMethod } from 'src/shared/constants/permission.constant'
import { Role } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services'

interface Route {
  path: string
  method: keyof typeof HTTPMethod
  name: string
  module: string
}

const prisma = new PrismaService()

const LABEL_MODULE = ['AUTH', 'MANAGE-PRODUCT', 'PROFILE', 'MEDIA', 'CART', 'ORDERS', 'REVIEWS', "ARTISTS", "PLAYLISTS"]
const LISTENER_MODULE = ['AUTH', 'PROFILE', 'MEDIA', 'CART', 'ORDERS', 'REVIEWS', "PLAYLISTS", "ARTISTS", "FOLLOWS"]
const VALID_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'] as const
type ValidHttpMethod = (typeof VALID_HTTP_METHODS)[number]

// ===== Helpers =====
function moduleFromPath(path: string): string {
  const seg = String(path?.split('/')[1] ?? '').trim()
  return seg.length ? seg.toUpperCase() : 'ROOT'
}

function normalizeAndFilterMethods(methods: string[] | undefined): ValidHttpMethod[] {
  if (!methods || !methods.length) return []
  return methods
    .map((m) => (m || '').toUpperCase())
    .filter((m): m is ValidHttpMethod => (VALID_HTTP_METHODS as readonly string[]).includes(m))
}

/** Trích xuất routes từ Express (hỗ trợ nhiều vị trí router khác nhau) */
function extractExpressRoutes(app: NestExpressApplication): Route[] {
  const availableRoutes: Route[] = []

  const httpServer: any = (app as any).getHttpServer?.()
  const expressInstance: any = (app as any).getHttpAdapter?.().getInstance?.()

  const router =
    expressInstance?._router ?? httpServer?._events?.request?._router ?? httpServer?._events?.request?.router ?? null

  if (!router?.stack?.length) {
    console.error(
      '[RouteScan][Express] Không truy cập được router stack. Đã kiểm tra expressInstance._router và httpServer._events.request._router.',
    )
    return availableRoutes
  }

  router.stack.forEach((layer: any) => {
    if (!layer?.route) return
    const path: string = layer.route.path
    const allMethods = Object.keys(layer.route.methods || {}).map((m) => m.toUpperCase())
    const methods = normalizeAndFilterMethods(allMethods)

    methods.forEach((method) => {
      availableRoutes.push({
        path,
        method: method as keyof typeof HTTPMethod,
        name: `${method} ${path}`,
        module: moduleFromPath(path),
      })
    })
  })

  return availableRoutes
}

const updateRole = async (permissionIds: { id: number }[], roleName: string) => {
  const role = await prisma.role.findFirstOrThrow({
    where: { name: roleName, deletedAt: null },
  })
  await prisma.role.update({
    where: { id: role.id },
    data: { permissions: { set: permissionIds } },
  })
  console.log(`✅ Updated role: ${roleName} with ${permissionIds.length} permissions`)
}

// ===== Bootstrap =====
async function bootstrap() {
  // ÉP dùng Express adapter cho chắc chắn
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(), { bufferLogs: true })

  try {
    const port = Number(process.env.SYNC_PORT ?? process.env.PORT ?? 3024)
    await app.listen(port)
    console.log('[RouteScan] HTTP adapter:', app.getHttpAdapter().getType()) // 'express'
    try {
      console.log('[RouteScan] Server URL:', await app.getUrl())
    } catch {}

    // 1) Quét routes
    const availableRoutes: Route[] = extractExpressRoutes(app)
    console.log('[RouteScan] Routes discovered:', availableRoutes.length)

    // 2) Lấy permissions hiện có
    const permissionsInDb = await prisma.permission.findMany({ where: { deletedAt: null } })

    // 3) Map để so khớp nhanh
    const permissionInDbMap = permissionsInDb.reduce<Record<string, any>>((acc, p: any) => {
      acc[`${p.method}-${p.path}`] = p
      return acc
    }, {})

    const availableRoutesMap = availableRoutes.reduce<Record<string, Route>>((acc, r) => {
      acc[`${r.method}-${r.path}`] = r
      return acc
    }, {})

    // 4) Xoá permission không còn route
    const permissionsToDelete = permissionsInDb.filter((p) => !availableRoutesMap[`${p.method}-${p.path}`])
    if (permissionsToDelete.length > 0) {
      const deletedPermissions = await prisma.permission.deleteMany({
        where: { id: { in: permissionsToDelete.map((p) => p.id) } },
      })
      console.log('🗑️  deletedPermissions:', deletedPermissions.count)
    } else {
      console.log('No permission to delete')
    }

    // 5) Thêm permission còn thiếu
    const routesToAdd = availableRoutes.filter((r) => !permissionInDbMap[`${r.method}-${r.path}`])
    console.log('Routes to add:', routesToAdd.length)
    if (routesToAdd.length > 0) {
      console.log('Sample routes:', routesToAdd.slice(0, 5))
      const addPermissions = await prisma.permission.createMany({
        data: routesToAdd,
        skipDuplicates: true,
      })
      console.log('➕ addPermissions:', addPermissions.count)
    } else {
      console.log('No permission to add')
    }

    // 6) Gán role
    const updatedPermissionsInDb = await prisma.permission.findMany({
      select: { id: true, name: true, description: true, path: true, method: true, module: true },
      where: { deletedAt: null },
    })

    const adminPermissionId = updatedPermissionsInDb.map((p) => ({ id: p.id }))
    const labelPermissionIds = updatedPermissionsInDb
      .filter((p) => LABEL_MODULE.includes(p.module))
      .map((p) => ({ id: p.id }))
    const listenerPermissionIds = updatedPermissionsInDb
      .filter((p) => LISTENER_MODULE.includes(p.module))
      .map((p) => ({ id: p.id }))

    await Promise.all([
      updateRole(adminPermissionId, Role.ADMIN),
      updateRole(labelPermissionIds, Role.LABEL),
      updateRole(listenerPermissionIds, Role.LISTENER),
    ])

    console.log('✅ Permissions synced successfully!')
  } catch (err) {
    console.error('❌ Bootstrap failed:', err)
    process.exitCode = 1
  } finally {
    try {
      await prisma.$disconnect()
    } catch {}
    try {
      await app.close()
    } catch {}
    process.exit(process.exitCode ?? 0)
  }
}

bootstrap().catch((err) => {
  console.error('❌ Uncaught bootstrap error:', err)
  process.exit(1)
})
