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
  Logger,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger'
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

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name)

  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(SepayPaymentQRResponseDto)
  @ApiOperation({ summary: 'Create transaction', description: 'Create a new payment transaction and get QR code. Requires authentication.' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiCreatedResponse({ description: 'Transaction created', type: SepayPaymentQRResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(@ActiveUser('userId') userId: number, @Body() createDto: CreateTransactionDto) {
    try {
      this.logger.log(`Create transaction for user ${userId}`)
      return await this.transactionService.create(userId, createDto)
    } catch (error) {
      this.logger.error(`Failed to create transaction for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(TransactionListResponseDto)
  @ApiOperation({ summary: 'Get all transactions', description: 'Retrieve paginated list of all transactions. Admin only.' })
  @ApiOkResponse({ description: 'Transactions retrieved', type: TransactionListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(@Query() query: QueryTransactionDto) {
    try {
      this.logger.log('Get all transactions')
      return await this.transactionService.findAll(query)
    } catch (error) {
      this.logger.error('Failed to get transactions', error.stack)
      throw error
    }
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(TransactionStatsResponseDto)
  @ApiOperation({ summary: 'Get transaction statistics', description: 'Retrieve transaction statistics. Admin only.' })
  @ApiOkResponse({ description: 'Statistics retrieved', type: TransactionStatsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getStats() {
    try {
      this.logger.log('Get transaction stats')
      return await this.transactionService.getStats()
    } catch (error) {
      this.logger.error('Failed to get transaction stats', error.stack)
      throw error
    }
  }

  @Get('my-transactions')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(TransactionListResponseDto)
  @ApiOperation({ summary: 'Get my transactions', description: 'Retrieve authenticated user\'s transaction history. Requires authentication.' })
  @ApiOkResponse({ description: 'User transactions retrieved', type: TransactionListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMyTransactions(
    @ActiveUser('userId') userId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    try {
      this.logger.log(`Get transactions for user ${userId}`)
      return await this.transactionService.getUserTransactions(userId, page, limit)
    } catch (error) {
      this.logger.error(`Failed to get transactions for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(TransactionResponseDto)
  @ApiOperation({ summary: 'Get transaction by ID', description: 'Retrieve specific transaction details. Requires authentication.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Transaction found', type: TransactionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Get transaction ${id}`)
      return await this.transactionService.findById(id)
    } catch (error) {
      this.logger.error(`Failed to get transaction ${id}`, error.stack)
      throw error
    }
  }

  @Post(':id/refund')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(TransactionResponseDto)
  @ApiOperation({ summary: 'Refund transaction', description: 'Process a refund for a transaction. Admin only.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: RefundTransactionDto })
  @ApiOkResponse({ description: 'Transaction refunded', type: TransactionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async refund(@Param('id', ParseIntPipe) id: number, @Body() refundDto: RefundTransactionDto) {
    try {
      this.logger.log(`Refund transaction ${id}`)
      const result = await this.transactionService.refund(id, refundDto)
      this.logger.log(`Transaction ${id} refunded`)
      return result
    } catch (error) {
      this.logger.error(`Failed to refund transaction ${id}`, error.stack)
      throw error
    }
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sepay webhook', description: 'Handle payment gateway webhook callback. Internal use only.' })
  async handleSepayWebhook(
    @Body() webhookData: SepayWebhookDto,
    @Headers('x-sepay-signature') signature: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('Processing Sepay webhook')
      await this.transactionService.processSepayCallback(webhookData, signature)

      return res.json({
        success: true,
        message: 'Webhook processed successfully',
      })
    } catch (error) {
      const err = error as Error
      this.logger.error('Failed to process webhook', err.stack)
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: err.message || 'Error processing webhook',
      })
    }
  }
}
