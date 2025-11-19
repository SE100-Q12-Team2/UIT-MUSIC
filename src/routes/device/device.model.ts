import { z } from 'zod'

export const DeviceSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.string(),
  createdAt: z.string(),
  isActive: z.boolean(),
})

export type DeviceType = z.infer<typeof DeviceSchema>

export const DeviceWithTokensSchema = DeviceSchema.extend({
  refreshTokenCount: z.number().int().nonnegative(),
})

export type DeviceWithTokensType = z.infer<typeof DeviceWithTokensSchema>

export const QueryDevicesSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined
      if (val === 'true') return true
      if (val === 'false') return false
      return undefined
    }),
  sortBy: z.enum(['lastActive', 'createdAt']).default('lastActive'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type QueryDevicesType = z.infer<typeof QueryDevicesSchema>

export const DeviceResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  deviceInfo: z.object({
    browser: z.string().optional(),
    os: z.string().optional(),
    device: z.string().optional(),
    platform: z.string().optional(),
  }),
  ip: z.string(),
  location: z.string().optional(),
  lastActive: z.string(),
  createdAt: z.string(),
  isActive: z.boolean(),
  isCurrent: z.boolean(),
  refreshTokenCount: z.number(),
})

export type DeviceResponseType = z.infer<typeof DeviceResponseSchema>

export const RevokeDeviceSchema = z.object({
  deviceId: z.number().int().positive(),
  revokeAllTokens: z.boolean().default(true),
})

export type RevokeDeviceType = z.infer<typeof RevokeDeviceSchema>

export const DeviceStatsSchema = z.object({
  totalDevices: z.number().int().nonnegative(),
  activeDevices: z.number().int().nonnegative(),
  inactiveDevices: z.number().int().nonnegative(),
  devicesByOS: z.array(
    z.object({
      os: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  devicesByBrowser: z.array(
    z.object({
      browser: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  recentLogins: z.array(DeviceResponseSchema).max(10),
})

export type DeviceStatsType = z.infer<typeof DeviceStatsSchema>
