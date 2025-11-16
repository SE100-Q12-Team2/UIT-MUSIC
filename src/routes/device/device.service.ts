import { Injectable, Logger } from '@nestjs/common'
import { DeviceRepository } from './device.repo'
import { QueryDevicesDto, DeviceResponseDto, DeviceStatsDto } from './device.dto'
import {
  DeviceNotFoundException,
  DeviceNotOwnedException,
  CannotRevokeCurrentDeviceException,
  DeviceAlreadyRevokedException,
} from './device.error'
import { UAParser } from 'ua-parser-js'

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name)

  constructor(private readonly deviceRepository: DeviceRepository) {}

  async getUserDevices(userId: number, query: QueryDevicesDto) {
    const result = await this.deviceRepository.findByUserId(userId, query)

    const devices = result.data.map((device) => this.transformDevice(device, null))

    this.logger.log(`Retrieved ${devices.length} devices for user ${userId}`)

    return {
      data: devices,
      pagination: result.pagination,
    }
  }

  async getDeviceById(userId: number, deviceId: number): Promise<DeviceResponseDto> {
    const device = await this.deviceRepository.findById(deviceId)

    if (!device) {
      throw DeviceNotFoundException
    }

    if (device.userId !== userId) {
      throw DeviceNotOwnedException
    }

    return this.transformDevice(device, null)
  }

  async revokeDevice(userId: number, deviceId: number, currentDeviceId?: number) {
    const device = await this.deviceRepository.findById(deviceId)

    if (!device) {
      throw DeviceNotFoundException
    }

    if (device.userId !== userId) {
      throw DeviceNotOwnedException
    }

    if (currentDeviceId && deviceId === currentDeviceId) {
      throw CannotRevokeCurrentDeviceException
    }

    if (!device.isActive) {
      throw DeviceAlreadyRevokedException
    }

    await this.deviceRepository.revokeAllTokens(deviceId)

    await this.deviceRepository.updateActiveStatus(deviceId, false)

    this.logger.log(`Revoked device ${deviceId} for user ${userId}`)

    return {
      success: true,
      message: 'Device revoked successfully',
    }
  }

  async revokeAllDevicesExceptCurrent(userId: number, currentDeviceId: number) {
    await this.deviceRepository.revokeAllExceptCurrent(userId, currentDeviceId)

    this.logger.log(`Revoked all devices except ${currentDeviceId} for user ${userId}`)

    return {
      success: true,
      message: 'All other devices revoked successfully',
    }
  }

  async deleteDevice(userId: number, deviceId: number, currentDeviceId?: number) {
    const device = await this.deviceRepository.findById(deviceId)

    if (!device) {
      throw DeviceNotFoundException
    }

    if (device.userId !== userId) {
      throw DeviceNotOwnedException
    }

    if (currentDeviceId && deviceId === currentDeviceId) {
      throw CannotRevokeCurrentDeviceException
    }

    await this.deviceRepository.deleteDevice(deviceId)

    this.logger.log(`Deleted device ${deviceId} for user ${userId}`)

    return {
      success: true,
      message: 'Device deleted successfully',
    }
  }

  async getDeviceStats(userId: number): Promise<DeviceStatsDto> {
    const stats = await this.deviceRepository.getDeviceStats(userId)

    const devicesByOS = new Map<string, number>()
    const devicesByBrowser = new Map<string, number>()

    stats.devices.forEach((device) => {
      const parser = new UAParser(device.userAgent)
      const os = parser.getOS().name || 'Unknown'
      const browser = parser.getBrowser().name || 'Unknown'

      devicesByOS.set(os, (devicesByOS.get(os) || 0) + 1)
      devicesByBrowser.set(browser, (devicesByBrowser.get(browser) || 0) + 1)
    })

    const recentLogins = stats.recentLogins.map((device) => this.transformDevice(device, null))

    this.logger.log(`Retrieved device statistics for user ${userId}`)

    return {
      totalDevices: stats.totalDevices,
      activeDevices: stats.activeDevices,
      inactiveDevices: stats.inactiveDevices,
      devicesByOS: Array.from(devicesByOS.entries()).map(([os, count]) => ({ os, count })),
      devicesByBrowser: Array.from(devicesByBrowser.entries()).map(([browser, count]) => ({
        browser,
        count,
      })),
      recentLogins,
    }
  }

  async registerDevice(userId: number, userAgent: string, ip: string) {
    const device = await this.deviceRepository.findOrCreate(userId, userAgent, ip)

    this.logger.log(`Registered device ${device.id} for user ${userId}`)

    return device
  }

  async updateLastActive(deviceId: number) {
    return this.deviceRepository.updateLastActive(deviceId)
  }

  private transformDevice(device: any, currentDeviceId: number | null): DeviceResponseDto {
    const userAgent = device.userAgent || ''
    const parser = new UAParser(userAgent)
    const browser = parser.getBrowser()
    const os = parser.getOS()
    const deviceInfo = parser.getDevice()

    console.log('User Agent:', userAgent)
    console.log('Parsed Device Info:', { browser, os, deviceInfo })

    return {
      id: device.id,
      userId: device.userId,
      deviceInfo: {
        browser: browser.name || 'Unknown',
        os: os.name || 'Unknown',
        device: deviceInfo.type || 'desktop',
        platform:
          (os.name || 'Unknown') && (browser.name || 'Unknown')
            ? `${os.name || 'Unknown'} - ${browser.name || 'Unknown'}`
            : 'Unknown Platform',
      },
      ip: device.ip,
      location: undefined,
      lastActive: device.lastActive,
      createdAt: device.createdAt,
      isActive: device.isActive,
      isCurrent: currentDeviceId ? device.id === currentDeviceId : false,
      refreshTokenCount: device._count?.refreshTokens || 0,
    }
  }
}
