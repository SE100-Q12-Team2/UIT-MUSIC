import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Res,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common'
import { Response } from 'express'
import { TransactionService } from './transaction.service'
import {
  CreateTransactionDto,
  QueryTransactionDto,
  RefundTransactionDto,
  SepayWebhookDto,
  TransactionResponseDto,
  TransactionListResponseDto,
  TransactionStatsResponseDto,
  SepayPaymentQRResponseDto,
} from './transaction.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(SepayPaymentQRResponseDto)
  async create(@ActiveUser('userId') userId: number, @Body() createDto: CreateTransactionDto) {
    return this.transactionService.create(userId, createDto)
  }

  @Get()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(TransactionListResponseDto)
  async findAll(@Query() query: QueryTransactionDto) {
    return this.transactionService.findAll(query)
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(TransactionStatsResponseDto)
  async getStats() {
    return this.transactionService.getStats()
  }

  @Get('my-transactions')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(TransactionListResponseDto)
  async getMyTransactions(
    @ActiveUser('userId') userId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.transactionService.getUserTransactions(userId, page, limit)
  }

  @Get(':id')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(TransactionResponseDto)
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.findById(id)
  }

  @Post(':id/refund')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(TransactionResponseDto)
  async refund(@Param('id', ParseIntPipe) id: number, @Body() refundDto: RefundTransactionDto) {
    return this.transactionService.refund(id, refundDto)
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleSepayWebhook(
    @Body() webhookData: SepayWebhookDto,
    @Headers('x-sepay-signature') signature: string,
    @Res() res: Response,
  ) {
    try {
      await this.transactionService.processSepayCallback(webhookData, signature)

      return res.json({
        success: true,
        message: 'Webhook processed successfully',
      })
    } catch (error) {
      const err = error as Error
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: err.message || 'Error processing webhook',
      })
    }
  }
}
