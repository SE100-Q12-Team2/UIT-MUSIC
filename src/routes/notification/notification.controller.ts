import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
import { NotificationService } from './notification.service'
import {
  CreateNotificationDto,
  CreateBulkNotificationDto,
  QueryNotificationsDto,
  MarkMultipleAsReadDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationStatsDto,
  MarkAsReadResponseDto,
  BulkNotificationResponseDto,
} from './notification.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(NotificationResponseDto)
  async create(@Body() createDto: CreateNotificationDto) {
    return this.notificationService.create(createDto)
  }

  @Post('bulk')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(BulkNotificationResponseDto)
  async createBulk(@Body() createDto: CreateBulkNotificationDto) {
    return this.notificationService.createBulk(createDto)
  }

  @Get()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(NotificationListResponseDto)
  async findAll(@ActiveUser('userId') userId: number, @Query() query: QueryNotificationsDto) {
    return this.notificationService.findAll(userId, query)
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(NotificationStatsDto)
  async getStats(@ActiveUser('userId') userId: number) {
    return this.notificationService.getStats(userId)
  }

  @Get('unread-count')
  @Auth([AuthType.Bearer])
  async getUnreadCount(@ActiveUser('userId') userId: number) {
    return this.notificationService.getUnreadCount(userId)
  }

  @Get(':id')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(NotificationResponseDto)
  async findById(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    return this.notificationService.findById(id, userId)
  }

  @Post(':id/read')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(NotificationResponseDto)
  async markAsRead(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    return this.notificationService.markAsRead(id, userId)
  }

  @Post('mark-all-read')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(MarkAsReadResponseDto)
  async markAllAsRead(@ActiveUser('userId') userId: number) {
    return this.notificationService.markAllAsRead(userId)
  }

  @Post('mark-multiple-read')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(MarkAsReadResponseDto)
  async markMultipleAsRead(@ActiveUser('userId') userId: number, @Body() markDto: MarkMultipleAsReadDto) {
    return this.notificationService.markMultipleAsRead(userId, markDto)
  }

  @Delete('read')
  @Auth([AuthType.Bearer])
  async deleteAllRead(@ActiveUser('userId') userId: number) {
    return this.notificationService.deleteAllRead(userId)
  }

  @Delete('multiple')
  @Auth([AuthType.Bearer])
  async deleteMultiple(@ActiveUser('userId') userId: number, @Body() body: { notificationIds: number[] }) {
    return this.notificationService.deleteMultiple(userId, body.notificationIds)
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  async delete(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    return this.notificationService.delete(id, userId)
  }
}
