import { Controller, Get, Post, Delete, Param, Query, ParseIntPipe } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { DeviceService } from './device.service'
import { QueryDevicesDto, DeviceResponseDto, DeviceStatsDto } from './device.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  @ZodSerializerDto(DeviceResponseDto)
  async getUserDevices(@ActiveUser('userId') userId: number, @Query() query: QueryDevicesDto) {
    return await this.deviceService.getUserDevices(userId, query)
  }

  @Get('stats')
  @ZodSerializerDto(DeviceStatsDto)
  async getDeviceStats(@ActiveUser('userId') userId: number) {
    return await this.deviceService.getDeviceStats(userId)
  }

  @Get(':id')
  @ZodSerializerDto(DeviceResponseDto)
  async getDeviceById(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    return await this.deviceService.getDeviceById(userId, id)
  }

  @Delete(':id/revoke')
  @ZodSerializerDto(MessageResDTO)
  async revokeDevice(
    @ActiveUser('userId') userId: number,
    @ActiveUser('deviceId') currentDeviceId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.deviceService.revokeDevice(userId, id, currentDeviceId)
  }

  @Post('revoke-all')
  @ZodSerializerDto(MessageResDTO)
  async revokeAllDevices(@ActiveUser('userId') userId: number, @ActiveUser('deviceId') currentDeviceId: number) {
    return await this.deviceService.revokeAllDevicesExceptCurrent(userId, currentDeviceId)
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  async deleteDevice(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    return await this.deviceService.deleteDevice(userId, id)
  }
}
