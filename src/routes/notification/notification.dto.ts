import { createZodDto } from 'nestjs-zod'
import {
  CreateNotificationSchema,
  CreateBulkNotificationSchema,
  UpdateNotificationSchema,
  QueryNotificationsSchema,
  MarkMultipleAsReadSchema,
  NotificationResponseSchema,
  NotificationListResponseSchema,
  NotificationStatsSchema,
  MarkAsReadResponseSchema,
  BulkNotificationResponseSchema,
} from './notification.model'

export class CreateNotificationDto extends createZodDto(CreateNotificationSchema) {}
export class CreateBulkNotificationDto extends createZodDto(CreateBulkNotificationSchema) {}
export class UpdateNotificationDto extends createZodDto(UpdateNotificationSchema) {}
export class QueryNotificationsDto extends createZodDto(QueryNotificationsSchema) {}
export class MarkMultipleAsReadDto extends createZodDto(MarkMultipleAsReadSchema) {}

export class NotificationResponseDto extends createZodDto(NotificationResponseSchema) {}
export class NotificationListResponseDto extends createZodDto(NotificationListResponseSchema) {}
export class NotificationStatsDto extends createZodDto(NotificationStatsSchema) {}
export class MarkAsReadResponseDto extends createZodDto(MarkAsReadResponseSchema) {}
export class BulkNotificationResponseDto extends createZodDto(BulkNotificationResponseSchema) {}
