import { createZodDto } from 'nestjs-zod'
import {
  DeviceSchema,
  DeviceWithTokensSchema,
  QueryDevicesSchema,
  DeviceResponseSchema,
  RevokeDeviceSchema,
  DeviceStatsSchema,
} from './device.model'

export class DeviceDto extends createZodDto(DeviceSchema) {}

export class DeviceWithTokensDto extends createZodDto(DeviceWithTokensSchema) {}

export class QueryDevicesDto extends createZodDto(QueryDevicesSchema) {}

export class DeviceResponseDto extends createZodDto(DeviceResponseSchema) {}

export class RevokeDeviceDto extends createZodDto(RevokeDeviceSchema) {}

export class DeviceStatsDto extends createZodDto(DeviceStatsSchema) {}

export class PaginatedDevicesResponseDto {
  data: DeviceResponseDto[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
