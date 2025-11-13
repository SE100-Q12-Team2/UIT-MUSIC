import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { NotificationType, Prisma } from '@prisma/client'
import { QueryNotificationsDto } from './notification.dto'
import { NotificationNotFoundException } from './notification.error'

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: number; notificationType: NotificationType; title: string; message: string }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        notificationType: data.notificationType,
        title: data.title,
        message: data.message,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    })
  }

  async createMany(
    userIds: number[],
    data: {
      notificationType: NotificationType
      title: string
      message: string
    },
  ) {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        this.prisma.notification.create({
          data: {
            userId,
            notificationType: data.notificationType,
            title: data.title,
            message: data.message,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        }),
      ),
    )

    return {
      count: notifications.length,
      notifications,
    }
  }

  async findAll(userId: number, query: QueryNotificationsDto) {
    const { page, limit, type, isRead } = query
    const skip = (page - 1) * limit

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(type && { notificationType: type }),
      ...(isRead !== undefined && { isRead }),
    }

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    }
  }

  async findById(id: number) {
    return this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    })
  }

  async markAsRead(id: number) {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw NotificationNotFoundException
        }
      }
      throw error
    }
  }

  async markMultipleAsRead(userId: number, notificationIds: number[]) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: {
        isRead: true,
      },
    })

    return result.count
  }

  async markAllAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return result.count
  }

  async delete(id: number) {
    try {
      return await this.prisma.notification.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw NotificationNotFoundException
        }
      }
      throw error
    }
  }

  async deleteMultiple(userId: number, notificationIds: number[]) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
    })

    return result.count
  }

  async deleteAllRead(userId: number) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    })

    return result.count
  }

  async getStats(userId: number) {
    const [total, unread, byType] = await Promise.all([
      this.prisma.notification.count({
        where: { userId },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
      this.prisma.notification.groupBy({
        by: ['notificationType'],
        where: { userId },
        _count: {
          id: true,
        },
      }),
    ])

    const byTypeMap: Record<string, number> = {}
    byType.forEach((item) => {
      byTypeMap[item.notificationType] = item._count.id
    })

    return {
      total,
      unread,
      read: total - unread,
      byType: byTypeMap,
    }
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })
  }

  async deleteOldNotifications(daysOld: number = 30, includeUnread: boolean = false) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const whereCondition: Prisma.NotificationWhereInput = {
      createdAt: {
        lt: cutoffDate,
      },
    }

    if (!includeUnread) {
      whereCondition.isRead = true
    }

    const result = await this.prisma.notification.deleteMany({
      where: whereCondition,
    })

    return result.count
  }
}
