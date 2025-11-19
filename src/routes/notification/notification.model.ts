import { NotificationTypeEnum } from 'src/shared/constants/notification.constant'
import { z } from 'zod'

export const NotificationSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  notificationType: NotificationTypeEnum,
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(),
})

export const CreateNotificationSchema = z.object({
  userId: z.number().int().positive(),
  notificationType: NotificationTypeEnum,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
})

export const CreateBulkNotificationSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1),
  notificationType: NotificationTypeEnum,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
})

export const UpdateNotificationSchema = z.object({
  isRead: z.boolean(),
})

export const QueryNotificationsSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10)),
  type: NotificationTypeEnum.optional(),
  isRead: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
})

export const MarkMultipleAsReadSchema = z.object({
  notificationIds: z.array(z.number().int().positive()).min(1),
})

export const NotificationResponseSchema = NotificationSchema.extend({
  user: z
    .object({
      id: z.number(),
      email: z.string(),
      fullName: z.string(),
    })
    .optional(),
})

export const NotificationListResponseSchema = z.object({
  data: z.array(NotificationResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
  unreadCount: z.number().int().nonnegative(),
})

export const NotificationStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  unread: z.number().int().nonnegative(),
  read: z.number().int().nonnegative(),
  byType: z.record(NotificationTypeEnum, z.number().int().nonnegative()),
})

export const MarkAsReadResponseSchema = z.object({
  success: z.boolean(),
  markedCount: z.number().int().nonnegative(),
})

export const BulkNotificationResponseSchema = z.object({
  success: z.boolean(),
  count: z.number().int().nonnegative(),
  notifications: z.array(NotificationResponseSchema),
  message: z.string(),
})

export type Notification = z.infer<typeof NotificationSchema>
export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>
export type CreateBulkNotificationDto = z.infer<typeof CreateBulkNotificationSchema>
export type UpdateNotificationDto = z.infer<typeof UpdateNotificationSchema>
export type QueryNotificationsDto = z.infer<typeof QueryNotificationsSchema>
export type MarkMultipleAsReadDto = z.infer<typeof MarkMultipleAsReadSchema>
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>
export type NotificationStats = z.infer<typeof NotificationStatsSchema>
export type MarkAsReadResponse = z.infer<typeof MarkAsReadResponseSchema>
export type BulkNotificationResponse = z.infer<typeof BulkNotificationResponseSchema>
