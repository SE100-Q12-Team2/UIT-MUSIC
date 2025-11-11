import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common'
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

@Controller('user-subscriptions')
@Auth([AuthType.Bearer])
export class UserSubscriptionController {
  constructor(private readonly userSubscriptionService: UserSubscriptionService) {}

  @Post()
  @ZodSerializerDto(UserSubscriptionResponseDto)
  async subscribe(@ActiveUser('userId') userId: number, @Body() body: CreateUserSubscriptionDto) {
    return await this.userSubscriptionService.subscribe(userId, body)
  }

  @Get()
  @ZodSerializerDto(PaginatedUserSubscriptionsResponseDto)
  async getUserSubscriptions(@ActiveUser('userId') userId: number, @Query() query: GetUserSubscriptionsQueryDto) {
    return await this.userSubscriptionService.getUserSubscriptions(userId, query)
  }

  @Get('status')
  @ZodSerializerDto(SubscriptionStatusResponseDto)
  async checkStatus(@ActiveUser('userId') userId: number) {
    return await this.userSubscriptionService.checkSubscriptionStatus(userId)
  }

  @Get('active')
  @ZodSerializerDto(UserSubscriptionResponseDto)
  async getActiveSubscription(@ActiveUser('userId') userId: number) {
    return await this.userSubscriptionService.getActiveSubscription(userId)
  }

  @Get(':id')
  @ZodSerializerDto(UserSubscriptionResponseDto)
  async getSubscriptionById(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    return await this.userSubscriptionService.getSubscriptionById(userId, id)
  }

  @Patch(':id')
  @ZodSerializerDto(UserSubscriptionResponseDto)
  async updateSubscription(
    @ActiveUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserSubscriptionDto,
  ) {
    return await this.userSubscriptionService.updateSubscription(userId, id, body)
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(CancelSubscriptionResponseDto)
  async cancelSubscription(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    return await this.userSubscriptionService.cancelSubscription(userId, id)
  }

  @Post(':id/renew')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(RenewSubscriptionResponseDto)
  async renewSubscription(@ActiveUser('userId') userId: number, @Param('id', ParseIntPipe) id: number) {
    return await this.userSubscriptionService.renewSubscription(userId, id)
  }
}
