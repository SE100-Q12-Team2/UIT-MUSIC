import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger'
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

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name)

  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(NotificationResponseDto)
  @ApiOperation({
    summary: 'Create notification',
    description: 'Create a new notification for a specific user. This endpoint allows sending notifications about system events, updates, or user actions. Requires authentication.',
  })
  @ApiBody({ type: CreateNotificationDto, description: 'Notification creation data' })
  @ApiCreatedResponse({ description: 'Notification created successfully', type: NotificationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid notification data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async create(@Body() createDto: CreateNotificationDto) {
    try {
      this.logger.log(`Create notification for user: ${createDto.userId}`)
      const result = await this.notificationService.create(createDto)
      this.logger.log(`Notification created successfully: ${result.id}`)
      return result
    } catch (error) {
      this.logger.error('Failed to create notification', error.stack)
      throw error
    }
  }

  @Post('bulk')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(BulkNotificationResponseDto)
  @ApiOperation({
    summary: 'Create bulk notifications',
    description: 'Create multiple notifications at once for different users. Useful for broadcasting announcements or system-wide notifications. Requires authentication.',
  })
  @ApiBody({ type: CreateBulkNotificationDto, description: 'Bulk notification creation data' })
  @ApiCreatedResponse({ description: 'Bulk notifications created successfully', type: BulkNotificationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid notification data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async createBulk(@Body() createDto: CreateBulkNotificationDto) {
    try {
      this.logger.log(`Create bulk notifications for ${createDto.userIds?.length || 0} users`)
      const result = await this.notificationService.createBulk(createDto)
      this.logger.log(`Bulk notifications created successfully`)
      return result
    } catch (error) {
      this.logger.error('Failed to create bulk notifications', error.stack)
      throw error
    }
  }

  @Get()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(NotificationListResponseDto)
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Retrieve paginated list of notifications for the authenticated user with optional filtering by read status, type, and date range. Includes notification count and pagination metadata.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean, description: 'Filter by read status' })
  @ApiOkResponse({ description: 'Notifications retrieved successfully', type: NotificationListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@ActiveUser('userId') userId: number, @Query() query: QueryNotificationsDto) {
    try {
      this.logger.log(`Get notifications for user: ${userId}`)
      const result = await this.notificationService.findAll(userId, query)
      this.logger.log(`Retrieved ${result.data.length} notifications for user: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get notifications for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(NotificationStatsDto)
  @ApiOperation({
    summary: 'Get notification statistics',
    description: 'Retrieve notification statistics for the authenticated user including total count, unread count, and counts by notification type. Useful for dashboard displays.',
  })
  @ApiOkResponse({ description: 'Notification stats retrieved successfully', type: NotificationStatsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getStats(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Get notification stats for user: ${userId}`)
      const result = await this.notificationService.getStats(userId)
      this.logger.log(`Notification stats retrieved for user: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get notification stats for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get('unread-count')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Retrieve the count of unread notifications for the authenticated user. Useful for displaying notification badges in the UI.',
  })
  @ApiOkResponse({ description: 'Unread count retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getUnreadCount(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Get unread count for user: ${userId}`)
      const result = await this.notificationService.getUnreadCount(userId)
      this.logger.log(`Unread count retrieved for user: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get unread count for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(NotificationResponseDto)
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve detailed information about a specific notification for the authenticated user. Ensures users can only access their own notifications.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Notification ID' })
  @ApiOkResponse({ description: 'Notification found successfully', type: NotificationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Notification not found or access denied' })
  async findById(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Get notification ${id} for user: ${userId}`)
      const result = await this.notificationService.findById(id, userId)
      this.logger.log(`Notification ${id} retrieved for user: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get notification ${id} for user ${userId}`, error.stack)
      throw error
    }
  }

  @Post(':id/read')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(NotificationResponseDto)
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read for the authenticated user. Updates the notification read status and timestamp.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Notification ID to mark as read' })
  @ApiOkResponse({ description: 'Notification marked as read successfully', type: NotificationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Notification not found or access denied' })
  async markAsRead(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Mark notification ${id} as read for user: ${userId}`)
      const result = await this.notificationService.markAsRead(id, userId)
      this.logger.log(`Notification ${id} marked as read for user: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to mark notification ${id} as read for user ${userId}`, error.stack)
      throw error
    }
  }

  @Post('mark-all-read')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MarkAsReadResponseDto)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications as read for the authenticated user. Useful for clearing all notification badges at once.',
  })
  @ApiOkResponse({ description: 'All notifications marked as read successfully', type: MarkAsReadResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async markAllAsRead(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Mark all notifications as read for user: ${userId}`)
      const result = await this.notificationService.markAllAsRead(userId)
      this.logger.log(`All notifications marked as read for user: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read for user ${userId}`, error.stack)
      throw error
    }
  }

  @Post('mark-multiple-read')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MarkAsReadResponseDto)
  @ApiOperation({
    summary: 'Mark multiple notifications as read',
    description: 'Mark selected notifications as read in bulk for the authenticated user. Accepts an array of notification IDs to update.',
  })
  @ApiBody({ type: MarkMultipleAsReadDto, description: 'Array of notification IDs to mark as read' })
  @ApiOkResponse({ description: 'Notifications marked as read successfully', type: MarkAsReadResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid notification IDs' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async markMultipleAsRead(@ActiveUser('userId') userId: number, @Body() markDto: MarkMultipleAsReadDto) {
    try {
      this.logger.log(`Mark ${markDto.notificationIds.length} notifications as read for user: ${userId}`)
      const result = await this.notificationService.markMultipleAsRead(userId, markDto)
      this.logger.log(`${markDto.notificationIds.length} notifications marked as read for user: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to mark multiple notifications as read for user ${userId}`, error.stack)
      throw error
    }
  }

  @Delete('read')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete all read notifications',
    description: 'Delete all read notifications for the authenticated user. Helps keep the notification list clean by removing already-read items.',
  })
  @ApiOkResponse({ description: 'All read notifications deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async deleteAllRead(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Delete all read notifications for user: ${userId}`)
      const result = await this.notificationService.deleteAllRead(userId)
      this.logger.log(`All read notifications deleted for user: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete all read notifications for user ${userId}`, error.stack)
      throw error
    }
  }

  @Delete('multiple')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete multiple notifications',
    description: 'Delete selected notifications in bulk for the authenticated user. Accepts an array of notification IDs to delete.',
  })
  @ApiBody({ schema: { type: 'object', properties: { notificationIds: { type: 'array', items: { type: 'number' } } } } })
  @ApiOkResponse({ description: 'Notifications deleted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid notification IDs' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async deleteMultiple(@ActiveUser('userId') userId: number, @Body() body: { notificationIds: number[] }) {
    try {
      this.logger.log(`Delete ${body.notificationIds.length} notifications for user: ${userId}`)
      const result = await this.notificationService.deleteMultiple(userId, body.notificationIds)
      this.logger.log(`${body.notificationIds.length} notifications deleted for user: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete multiple notifications for user ${userId}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a specific notification for the authenticated user. Permanently removes the notification from the database.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Notification ID to delete' })
  @ApiOkResponse({ description: 'Notification deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Notification not found or access denied' })
  async delete(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Delete notification ${id} for user: ${userId}`)
      const result = await this.notificationService.delete(id, userId)
      this.logger.log(`Notification ${id} deleted for user: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete notification ${id} for user ${userId}`, error.stack)
      throw error
    }
  }
}
