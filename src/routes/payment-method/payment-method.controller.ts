import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger'
import { PaymentMethodService } from './payment-method.service'
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  QueryPaymentMethodDto,
  PaymentMethodResponseDto,
  PaymentMethodListResponseDto,
  PaymentMethodStatsResponseDto,
} from './payment-method.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'

@ApiTags('Payment Methods')
@Controller('payment-methods')
export class PaymentMethodController {
  private readonly logger = new Logger(PaymentMethodController.name)

  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(PaymentMethodResponseDto)
  @ApiOperation({ summary: 'Create payment method', description: 'Create a new payment method. Admin only.' })
  @ApiBody({ type: CreatePaymentMethodDto })
  @ApiCreatedResponse({ description: 'Payment method created', type: PaymentMethodResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(@Body() createDto: CreatePaymentMethodDto) {
    try {
      this.logger.log('Create payment method')
      return await this.paymentMethodService.create(createDto)
    } catch (error) {
      this.logger.error('Failed to create payment method', error.stack)
      throw error
    }
  }

  @Get()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(PaymentMethodListResponseDto)
  @ApiOperation({ summary: 'Get all payment methods', description: 'Retrieve list of payment methods. Admin only.' })
  @ApiOkResponse({ description: 'Payment methods retrieved', type: PaymentMethodListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(@Query() query: QueryPaymentMethodDto) {
    try {
      this.logger.log('Get all payment methods')
      return await this.paymentMethodService.findAll(query)
    } catch (error) {
      this.logger.error('Failed to get payment methods', error.stack)
      throw error
    }
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(PaymentMethodStatsResponseDto)
  @ApiOperation({ summary: 'Get payment method statistics', description: 'Retrieve statistics. Admin only.' })
  @ApiOkResponse({ description: 'Statistics retrieved', type: PaymentMethodStatsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getStats() {
    try {
      this.logger.log('Get payment method stats')
      return await this.paymentMethodService.getStats()
    } catch (error) {
      this.logger.error('Failed to get stats', error.stack)
      throw error
    }
  }

  @Get(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(PaymentMethodResponseDto)
  @ApiOperation({ summary: 'Get payment method by ID', description: 'Retrieve specific payment method. Admin only.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Payment method found', type: PaymentMethodResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Get payment method ${id}`)
      return await this.paymentMethodService.findById(id)
    } catch (error) {
      this.logger.error(`Failed to get payment method ${id}`, error.stack)
      throw error
    }
  }

  @Put(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(PaymentMethodResponseDto)
  @ApiOperation({ summary: 'Update payment method', description: 'Update payment method details. Admin only.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePaymentMethodDto })
  @ApiOkResponse({ description: 'Payment method updated', type: PaymentMethodResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdatePaymentMethodDto) {
    try {
      this.logger.log(`Update payment method ${id}`)
      return await this.paymentMethodService.update(id, updateDto)
    } catch (error) {
      this.logger.error(`Failed to update payment method ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete payment method', description: 'Delete a payment method. Admin only.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Payment method deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Delete payment method ${id}`)
      await this.paymentMethodService.delete(id)
      return { message: 'Payment method deleted successfully' }
    } catch (error) {
      this.logger.error(`Failed to delete payment method ${id}`, error.stack)
      throw error
    }
  }
}
