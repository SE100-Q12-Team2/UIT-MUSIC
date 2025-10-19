import { PermissionSchema } from 'src/routes/permission/permission.model'
import { RoleSchema } from 'src/shared/models/shared-role.model'
import { z } from 'zod'

export const RoleWithPermissionsSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema),
})

export const CreateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true,
}).strict()

export const CreateRoleResSchema = RoleSchema

export const UpdateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true,
})
  .extend({
    permissionIds: z.array(z.number()),
  })
  .strict()

export const UpdateRoleResSchema = RoleSchema

export const GetRolesResSchema = z.object({
  data: z.array(RoleSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetRoleDetailResSchema = RoleWithPermissionsSchema

export const GetRoleQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
  })
  .strict()

export const GetRoleParamSchema = z
  .object({
    id: z.coerce.number(),
  })
  .strict()

export type RoleWithPermissionType = z.infer<typeof RoleWithPermissionsSchema>

export type CreateRoleBodyType = z.infer<typeof CreateRoleBodySchema>

export type CreateRoleResType = z.infer<typeof CreateRoleResSchema>

export type UpdateRoleBodyType = z.infer<typeof UpdateRoleBodySchema>

export type UpdateRoleResType = z.infer<typeof UpdateRoleResSchema>

export type GetRoleResType = z.infer<typeof GetRolesResSchema>

export type GetRoleDetailResType = z.infer<typeof GetRoleDetailResSchema>

export type GetRoleQueryType = z.infer<typeof GetRoleQuerySchema>

export type GetRoleParamType = z.infer<typeof GetRoleParamSchema>
