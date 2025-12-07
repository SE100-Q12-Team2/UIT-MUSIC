import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'
import { UserSubscriptionService } from './user-subscription.service'
import {
  CreateUserSubscriptionDto,
  UpdateUserSubscriptionDto,
  GetUserSubscriptionsQueryDto,
  UserSubscriptionResponseDto,
  PaginatedUserSubscriptionsResponseDto,
  CancelSubscriptionResponseDto,
  RenewSubscriptionResponseDto,
  SubscriptionStatusResponseDto,
} from './user-subscription.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('User Subscriptions')
@Controller('user-subscriptions')
@Auth([AuthType.Bearer])
export class UserSubscriptionController {
  private readonly logger = new Logger(UserSubscriptionController.name)

  constructor(private readonly userSubscriptionService: UserSubscriptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UserSubscriptionResponseDto)
  @ApiOperation({ summary: 'Subscribe', description: 'Subscribe to a plan. Requires authentication.' })
  @ApiBody({ type: CreateUserSubscriptionDto })
  @ApiCreatedResponse({ description: 'Subscription created', type: UserSubscriptionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async subscribe(@ActiveUser('userId') userId: number, @Body() body: CreateUserSubscriptionDto) {
    try {
      this.logger.log(`User ${userId} subscribing to plan`)
      return await this.userSubscriptionService.subscribe(userId, body)
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId}`, error.stack)
      throw error
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(PaginatedUserSubscriptionsResponseDto)
  @ApiOperation({ summary: 'Get my subscriptions', description: 'Get subscription history for authenticated user. Requires authentication.' })
  @ApiOkResponse({ description: 'Subscriptions retrieved', type: PaginatedUserSubscriptionsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getUserSubscriptions(@ActiveUser('userId') userId: number, @Query() query: GetUserSubscriptionsQueryDto) {
    try {
      this.logger.log(`Get subscriptions for user ${userId}`)
      return await this.userSubscriptionService.getUserSubscriptions(userId, query)
    } catch (error) {
      this.logger.error(`Failed to get subscriptions`, error.stack)
      throw error
    }
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(SubscriptionStatusResponseDto)
  @ApiOperation({ summary: 'Check subscription status', description: 'Check current subscription status for user. Requires authentication.' })
  @ApiOkResponse({ description: 'Status retrieved', type: SubscriptionStatusResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async checkStatus(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Check subscription status for user ${userId}`)
      return await this.userSubscriptionService.checkSubscriptionStatus(userId)
    } catch (error) {
      this.logger.error(`Failed to check status`, error.stack)
      throw error
    }
  }

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UserSubscriptionResponseDto)
  @ApiOperation({ summary: 'Get active subscription', description: 'Get currently active subscription for user. Requires authentication.' })
  @ApiOkResponse({ description: 'Active subscription retrieved', type: UserSubscriptionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'No active subscription' })
  async getActiveSubscription(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Get active subscription for user ${userId}`)
      return await this.userSubscriptionService.getActiveSubscription(userId)
    } catch (error) {
      this.logger.error(`Failed to get active subscription`, error.stack)
      throw error
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UserSubscriptionResponseDto)
  @ApiOperation({ summary: 'Get subscription by ID', description: 'Get specific subscription details. Requires authentication.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Subscription found', type: UserSubscriptionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  async getSubscriptionById(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Get subscription ${id} for user ${userId}`)
      return await this.userSubscriptionService.getSubscriptionById(userId, id)
    } catch (error) {
      this.logger.error(`Failed to get subscription ${id}`, error.stack)
      throw error
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UserSubscriptionResponseDto)
  @ApiOperation({ summary: 'Update subscription', description: 'Update subscription details. Requires authentication.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateUserSubscriptionDto })
  @ApiOkResponse({ description: 'Subscription updated', type: UserSubscriptionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  async updateSubscription(
    @ActiveUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserSubscriptionDto,
  ) {
    try {
      this.logger.log(`Update subscription ${id} for user ${userId}`)
      return await this.userSubscriptionService.updateSubscription(userId, id, body)
    } catch (error) {
      this.logger.error(`Failed to update subscription ${id}`, error.stack)
      throw error
    }
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(CancelSubscriptionResponseDto)
  @ApiOperation({ summary: 'Cancel subscription', description: 'Cancel an active subscription. Requires authentication.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Subscription cancelled', type: CancelSubscriptionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  async cancelSubscription(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Cancel subscription ${id} for user ${userId}`)
      const result = await this.userSubscriptionService.cancelSubscription(userId, id)
      this.logger.log(`Subscription ${id} cancelled`)
      return result
    } catch (error) {
      this.logger.error(`Failed to cancel subscription ${id}`, error.stack)
      throw error
    }
  }

  @Post(':id/renew')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(RenewSubscriptionResponseDto)
  @ApiOperation({ summary: 'Renew subscription', description: 'Renew a cancelled or expired subscription. Requires authentication.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Subscription renewed', type: RenewSubscriptionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  async renewSubscription(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Renew subscription ${id} for user ${userId}`)
      const result = await this.userSubscriptionService.renewSubscription(userId, id)
      this.logger.log(`Subscription ${id} renewed`)
      return result
    } catch (error) {
      this.logger.error(`Failed to renew subscription ${id}`, error.stack)
      throw error
    }
  }
}
