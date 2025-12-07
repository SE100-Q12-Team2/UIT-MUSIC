import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'
import { SubscriptionPlanService } from './subscription-plan.service'
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  GetSubscriptionPlansQueryDto,
  SubscriptionPlanResponseDto,
  PaginatedSubscriptionPlansResponseDto,
  SubscriptionPlanStatsDto,
} from './subscription-plan.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@ApiTags('Subscription Plans')
@Controller('subscription-plans')
@Auth([AuthType.Bearer])
export class SubscriptionPlanController {
  private readonly logger = new Logger(SubscriptionPlanController.name)

  constructor(private readonly subscriptionPlanService: SubscriptionPlanService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(SubscriptionPlanResponseDto)
  @ApiOperation({ summary: 'Create subscription plan', description: 'Create a new subscription plan with pricing and features. Admin only.' })
  @ApiBody({ type: CreateSubscriptionPlanDto })
  @ApiCreatedResponse({ description: 'Plan created', type: SubscriptionPlanResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createPlan(@Body() body: CreateSubscriptionPlanDto) {
    try {
      this.logger.log('Create subscription plan')
      const result = await this.subscriptionPlanService.createPlan(body)
      this.logger.log(`Plan created: ${result.id}`)
      return result
    } catch (error) {
      this.logger.error('Failed to create plan', error.stack)
      throw error
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(PaginatedSubscriptionPlansResponseDto)
  @ApiOperation({ summary: 'Get subscription plans', description: 'Retrieve paginated list of subscription plans. Admin only.' })
  @ApiOkResponse({ description: 'Plans retrieved', type: PaginatedSubscriptionPlansResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getPlans(@Query() query: GetSubscriptionPlansQueryDto) {
    try {
      this.logger.log('Get subscription plans')
      return await this.subscriptionPlanService.getPlans(query)
    } catch (error) {
      this.logger.error('Failed to get plans', error.stack)
      throw error
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(SubscriptionPlanStatsDto)
  @ApiOperation({ summary: 'Get plan statistics', description: 'Retrieve subscription plan statistics. Admin only.' })
  @ApiOkResponse({ description: 'Statistics retrieved', type: SubscriptionPlanStatsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getStats() {
    try {
      this.logger.log('Get subscription plan stats')
      return await this.subscriptionPlanService.getStats()
    } catch (error) {
      this.logger.error('Failed to get stats', error.stack)
      throw error
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(SubscriptionPlanResponseDto)
  @ApiOperation({ summary: 'Get plan by ID', description: 'Retrieve specific subscription plan. Admin only.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Plan found', type: SubscriptionPlanResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Plan not found' })
  async getPlanById(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Get plan ${id}`)
      return await this.subscriptionPlanService.getPlanById(id)
    } catch (error) {
      this.logger.error(`Failed to get plan ${id}`, error.stack)
      throw error
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(SubscriptionPlanResponseDto)
  @ApiOperation({ summary: 'Update plan', description: 'Update subscription plan details. Admin only.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  @ApiOkResponse({ description: 'Plan updated', type: SubscriptionPlanResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Plan not found' })
  async updatePlan(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateSubscriptionPlanDto) {
    try {
      this.logger.log(`Update plan ${id}`)
      const result = await this.subscriptionPlanService.updatePlan(id, body)
      this.logger.log(`Plan ${id} updated`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update plan ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({ summary: 'Delete plan', description: 'Delete a subscription plan. Admin only.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Plan deleted', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Plan not found' })
  async deletePlan(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Delete plan ${id}`)
      const result = await this.subscriptionPlanService.deletePlan(id)
      this.logger.log(`Plan ${id} deleted`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete plan ${id}`, error.stack)
      throw error
    }
  }
}
