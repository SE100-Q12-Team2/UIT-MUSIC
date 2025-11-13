import { Injectable, Logger } from '@nestjs/common'
import { NotificationRepository } from './notification.repo'
import {
  CreateNotificationDto,
  CreateBulkNotificationDto,
  QueryNotificationsDto,
  MarkMultipleAsReadDto,
} from './notification.dto'
import {
  NotificationNotFoundException,
  NotificationAccessDeniedException,
  InvalidUserIdsException,
  UserNotFoundForNotificationException,
} from './notification.error'
import { NotificationType } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(
    private readonly repository: NotificationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(data: CreateNotificationDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    })

    if (!userExists) {
      throw UserNotFoundForNotificationException
    }

    const notification = await this.repository.create({
      userId: data.userId,
      notificationType: data.notificationType,
      title: data.title,
      message: data.message,
    })

    this.logger.log(`Created notification ${notification.id} for user ${data.userId}`)

    return notification
  }

  async createBulk(data: CreateBulkNotificationDto) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: data.userIds },
      },
      select: { id: true },
    })

    if (users.length !== data.userIds.length) {
      throw InvalidUserIdsException
    }

    const result = await this.repository.createMany(data.userIds, {
      notificationType: data.notificationType,
      title: data.title,
      message: data.message,
    })

    this.logger.log(`Created ${result.count} notifications for ${data.userIds.length} users`)

    return {
      success: true,
      count: result.count,
      notifications: result.notifications,
      message: `Notifications sent to ${result.count} users`,
    }
  }

  async findAll(userId: number, query: QueryNotificationsDto) {
    const result = await this.repository.findAll(userId, query)

    this.logger.log(`Retrieved ${result.data.length} notifications for user ${userId}`)

    return result
  }

  async findById(id: number, userId: number) {
    const notification = await this.repository.findById(id)

    if (!notification) {
      throw NotificationNotFoundException
    }

    if (notification.userId !== userId) {
      throw NotificationAccessDeniedException
    }

    return notification
  }

  async markAsRead(id: number, userId: number) {
    await this.findById(id, userId)

    const notification = await this.repository.markAsRead(id)

    this.logger.log(`Marked notification ${id} as read for user ${userId}`)

    return notification
  }

  async markMultipleAsRead(userId: number, data: MarkMultipleAsReadDto) {
    const count = await this.repository.markMultipleAsRead(userId, data.notificationIds)

    this.logger.log(`Marked ${count} notifications as read for user ${userId}`)

    return {
      success: true,
      markedCount: count,
    }
  }

  async markAllAsRead(userId: number) {
    const count = await this.repository.markAllAsRead(userId)

    this.logger.log(`Marked all ${count} notifications as read for user ${userId}`)

    return {
      success: true,
      markedCount: count,
    }
  }

  async delete(id: number, userId: number) {
    await this.findById(id, userId)

    await this.repository.delete(id)

    this.logger.log(`Deleted notification ${id} for user ${userId}`)

    return {
      success: true,
      message: 'Notification deleted successfully',
    }
  }

  async deleteMultiple(userId: number, notificationIds: number[]) {
    const count = await this.repository.deleteMultiple(userId, notificationIds)

    this.logger.log(`Deleted ${count} notifications for user ${userId}`)

    return {
      success: true,
      deletedCount: count,
    }
  }

  async deleteAllRead(userId: number) {
    const count = await this.repository.deleteAllRead(userId)

    this.logger.log(`Deleted all ${count} read notifications for user ${userId}`)

    return {
      success: true,
      deletedCount: count,
    }
  }

  async getStats(userId: number) {
    const stats = await this.repository.getStats(userId)

    this.logger.log(`Retrieved notification stats for user ${userId}`)

    return stats
  }

  async getUnreadCount(userId: number) {
    const count = await this.repository.getUnreadCount(userId)

    return {
      unreadCount: count,
    }
  }

  async notifySubscriptionExpiry(userId: number, daysRemaining: number) {
    return this.create({
      userId,
      notificationType: NotificationType.SubscriptionExpiry,
      title: 'Subscription Expiring Soon',
      message: `Your premium subscription will expire in ${daysRemaining} days. Renew now to continue enjoying premium features.`,
    })
  }

  async notifyNewRelease(userIds: number[], artistName: string, songTitle: string) {
    return this.createBulk({
      userIds,
      notificationType: NotificationType.NewRelease,
      title: 'New Release',
      message: `${artistName} just released a new song: "${songTitle}". Check it out now!`,
    })
  }

  async notifySystemUpdate(userIds: number[], updateTitle: string, updateMessage: string) {
    return this.createBulk({
      userIds,
      notificationType: NotificationType.SystemUpdate,
      title: updateTitle,
      message: updateMessage,
    })
  }

  async notifyCopyrightIssue(userId: number, songTitle: string, reason: string) {
    return this.create({
      userId,
      notificationType: NotificationType.CopyrightNotice,
      title: 'Copyright Notice',
      message: `Your song "${songTitle}" has been flagged: ${reason}. Please review and take action.`,
    })
  }

  async cleanupOldNotifications(daysOld: number = 30, includeUnread: boolean = false) {
    const count = await this.repository.deleteOldNotifications(daysOld, includeUnread)

    this.logger.log(
      `Cleaned up ${count} old notifications (older than ${daysOld} days, includeUnread: ${includeUnread})`,
    )

    return {
      success: true,
      deletedCount: count,
    }
  }
}
