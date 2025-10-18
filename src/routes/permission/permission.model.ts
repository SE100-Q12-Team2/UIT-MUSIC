import { HTTPMethod } from 'src/shared/constants/permission.constant'
import { z } from 'zod'

export const PermissionSchema = z.object({
  name: z.string().max(500),
  description: z.string(),
  path: z.string().max(1000),
  method: z.enum([
    HTTPMethod.GET,
    HTTPMethod.POST,
    HTTPMethod.PATCH,
    HTTPMethod.PUT,
    HTTPMethod.DELETE,
    HTTPMethod.OPTIONS,
    HTTPMethod.HEAD,
  ]),
  module: z.string(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable()
})


export const CreatePermissionBodySchema = PermissionSchema.pick({
  name: true,
  method: true,
  path: true,
  module: true
}).strict()

export const UpdatePermissionBodySchema = CreatePermissionBodySchema

export const GetPermissionParamsSchema = z
  .object({
    id: z.coerce.number(),
  })
  .strict()

export const GetPermissionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
}).strict()

export const GetPermissionResSchema = z.object({
  data: z.array(PermissionSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export type PermissionType = z.infer<typeof PermissionSchema>

export type GetPermissionParamType = z.infer<typeof GetPermissionParamsSchema>

export type GetPermissionQueryType = z.infer<typeof GetPermissionQuerySchema>

export type GetPermissionResType = z.infer<typeof GetPermissionResSchema>

export type CreatePermissionBodyType =  z.infer<typeof CreatePermissionBodySchema>

export type UpdatePermissionBodyType =  z.infer<typeof UpdatePermissionBodySchema>

