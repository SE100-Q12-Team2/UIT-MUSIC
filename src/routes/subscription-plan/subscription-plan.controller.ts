import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
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

@Controller('subscription-plans')
@Auth([AuthType.Bearer])
export class SubscriptionPlanController {
  constructor(private readonly subscriptionPlanService: SubscriptionPlanService) {}

  @Post()
  @ZodSerializerDto(SubscriptionPlanResponseDto)
  async createPlan(@Body() body: CreateSubscriptionPlanDto) {
    return await this.subscriptionPlanService.createPlan(body)
  }

  @Get()
  @ZodSerializerDto(PaginatedSubscriptionPlansResponseDto)
  async getPlans(@Query() query: GetSubscriptionPlansQueryDto) {
    return await this.subscriptionPlanService.getPlans(query)
  }

  @Get('stats')
  @ZodSerializerDto(SubscriptionPlanStatsDto)
  async getStats() {
    return await this.subscriptionPlanService.getStats()
  }

  @Get(':id')
  @ZodSerializerDto(SubscriptionPlanResponseDto)
  async getPlanById(@Param('id', ParseIntPipe) id: number) {
    return await this.subscriptionPlanService.getPlanById(id)
  }

  @Patch(':id')
  @ZodSerializerDto(SubscriptionPlanResponseDto)
  async updatePlan(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateSubscriptionPlanDto) {
    return await this.subscriptionPlanService.updatePlan(id, body)
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  async deletePlan(@Param('id', ParseIntPipe) id: number) {
    return await this.subscriptionPlanService.deletePlan(id)
  }
}
