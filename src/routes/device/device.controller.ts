import { Controller, Get, Post, Delete, Param, Query, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'
import { DeviceService } from './device.service'
import { QueryDevicesDto, DeviceResponseDto, DeviceStatsDto } from './device.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('Devices')
@Controller('devices')
@Auth([AuthType.Bearer])
export class DeviceController {
  private readonly logger = new Logger(DeviceController.name)

  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(DeviceResponseDto)
  @ApiOperation({
    summary: 'Get user devices',
    description: 'Retrieve all devices registered to the authenticated user with optional filtering. Requires authentication.',
  })
  @ApiOkResponse({ description: 'Devices retrieved successfully', type: DeviceResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getUserDevices(@ActiveUser('userId') userId: number, @Query() query: QueryDevicesDto) {
    try {
      this.logger.log(`Get devices for user ${userId}`)
      const result = await this.deviceService.getUserDevices(userId, query)
      return result
    } catch (error) {
      this.logger.error(`Failed to get devices for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(DeviceStatsDto)
  @ApiOperation({
    summary: 'Get device statistics',
    description: 'Retrieve statistics about user\'s registered devices. Requires authentication.',
  })
  @ApiOkResponse({ description: 'Device statistics retrieved', type: DeviceStatsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getDeviceStats(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Get device stats for user ${userId}`)
      const result = await this.deviceService.getDeviceStats(userId)
      return result
    } catch (error) {
      this.logger.error(`Failed to get device stats for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(DeviceResponseDto)
  @ApiOperation({
    summary: 'Get device by ID',
    description: 'Retrieve detailed information about a specific device. Requires authentication and ownership.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Device ID' })
  @ApiOkResponse({ description: 'Device found', type: DeviceResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Device not found' })
  async getDeviceById(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Get device ${id} for user ${userId}`)
      const result = await this.deviceService.getDeviceById(userId, id)
      return result
    } catch (error) {
      this.logger.error(`Failed to get device ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Revoke device',
    description: 'Revoke access for a specific device, logging it out. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Device ID to revoke' })
  @ApiOkResponse({ description: 'Device revoked successfully', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Device not found' })
  async revokeDevice(
    @ActiveUser('userId') userId: number,
    @ActiveUser('deviceId') currentDeviceId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      this.logger.log(`Revoke device ${id} for user ${userId}`)
      const result = await this.deviceService.revokeDevice(userId, id, currentDeviceId)
      this.logger.log(`Device ${id} revoked`)
      return result
    } catch (error) {
      this.logger.error(`Failed to revoke device ${id}`, error.stack)
      throw error
    }
  }

  @Post('revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Revoke all devices',
    description: 'Revoke access for all devices except the current one, logging out all other sessions. Requires authentication.',
  })
  @ApiOkResponse({ description: 'All other devices revoked', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async revokeAllDevices(@ActiveUser('userId') userId: number, @ActiveUser('deviceId') currentDeviceId: number) {
    try {
      this.logger.log(`Revoke all devices for user ${userId} except ${currentDeviceId}`)
      const result = await this.deviceService.revokeAllDevicesExceptCurrent(userId, currentDeviceId)
      this.logger.log(`All devices revoked for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to revoke all devices for user ${userId}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Delete device',
    description: 'Permanently delete a device record. Requires authentication and ownership.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Device ID to delete' })
  @ApiOkResponse({ description: 'Device deleted successfully', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Device not found' })
  async deleteDevice(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Delete device ${id} for user ${userId}`)
      const result = await this.deviceService.deleteDevice(userId, id)
      this.logger.log(`Device ${id} deleted`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete device ${id}`, error.stack)
      throw error
    }
  }
}
