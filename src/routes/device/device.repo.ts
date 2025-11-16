import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma } from '@prisma/client'
import { QueryDevicesType } from './device.model'
import { DeviceNotFoundException } from './device.error'

@Injectable()
export class DeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: number; userAgent: string; ip: string }) {
    return this.prisma.device.create({
      data: {
        userId: data.userId,
        userAgent: data.userAgent,
        ip: data.ip,
        isActive: true,
      },
    })
  }

  async findById(deviceId: number) {
    return this.prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        _count: {
          select: {
            refreshTokens: true,
          },
        },
      },
    })
  }

  async findByIdWithUser(deviceId: number) {
    return this.prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            refreshTokens: true,
          },
        },
      },
    })
  }

  async findByUserId(userId: number, query: QueryDevicesType) {
    const { page, limit, isActive, sortBy, sortOrder } = query
    const skip = (page - 1) * limit

    const where: Prisma.DeviceWhereInput = {
      userId,
      ...(isActive !== undefined && { isActive }),
    }

    const orderBy: Prisma.DeviceOrderByWithRelationInput =
      sortBy === 'createdAt' ? { createdAt: sortOrder } : { lastActive: sortOrder }

    const [devices, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              refreshTokens: true,
            },
          },
        },
      }),
      this.prisma.device.count({ where }),
    ])

    return {
      data: devices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findOrCreate(userId: number, userAgent: string, ip: string) {
    const existingDevice = await this.prisma.device.findFirst({
      where: {
        userId,
        userAgent,
        ip,
      },
    })

    if (existingDevice) {
      return this.prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          lastActive: new Date(),
          isActive: true,
        },
      })
    }

    return this.create({ userId, userAgent, ip })
  }

  async updateActiveStatus(deviceId: number, isActive: boolean) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: { isActive },
    })
  }

  async updateLastActive(deviceId: number) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: {
        lastActive: new Date(),
      },
    })
  }

  async revokeAllTokens(deviceId: number) {
    return this.prisma.refreshToken.deleteMany({
      where: { deviceId },
    })
  }

  async deleteDevice(deviceId: number) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    })

    if (!device) {
      throw DeviceNotFoundException
    }

    return this.prisma.device.delete({
      where: { id: deviceId },
    })
  }

  async getDeviceStats(userId: number) {
    const devices = await this.prisma.device.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            refreshTokens: true,
          },
        },
      },
      orderBy: {
        lastActive: 'desc',
      },
    })

    const totalDevices = devices.length
    const activeDevices = devices.filter((d) => d.isActive).length
    const inactiveDevices = totalDevices - activeDevices

    const recentLogins = devices.slice(0, 10)

    return {
      totalDevices,
      activeDevices,
      inactiveDevices,
      recentLogins,
      devices,
    }
  }

  async revokeAllExceptCurrent(userId: number, currentDeviceId: number) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        deviceId: {
          not: currentDeviceId,
        },
      },
    })

    return this.prisma.device.updateMany({
      where: {
        userId,
        id: {
          not: currentDeviceId,
        },
      },
      data: {
        isActive: false,
      },
    })
  }

  async isDeviceOwnedByUser(deviceId: number, userId: number): Promise<boolean> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      select: { userId: true },
    })

    return device?.userId === userId
  }

  async getActiveDevicesCount(userId: number): Promise<number> {
    return this.prisma.device.count({
      where: {
        userId,
        isActive: true,
      },
    })
  }
}
