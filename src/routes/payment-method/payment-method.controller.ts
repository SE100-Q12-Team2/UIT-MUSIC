import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
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

@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(PaymentMethodResponseDto)
  async create(@Body() createDto: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(createDto)
  }

  @Get()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(PaymentMethodListResponseDto)
  async findAll(@Query() query: QueryPaymentMethodDto) {
    return this.paymentMethodService.findAll(query)
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(PaymentMethodStatsResponseDto)
  async getStats() {
    return this.paymentMethodService.getStats()
  }

  @Get(':id')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(PaymentMethodResponseDto)
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.findById(id)
  }

  @Put(':id')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(PaymentMethodResponseDto)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdatePaymentMethodDto) {
    return this.paymentMethodService.update(id, updateDto)
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.paymentMethodService.delete(id)
    return { message: 'Payment method deleted successfully' }
  }
}
