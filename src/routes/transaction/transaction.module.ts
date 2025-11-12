import { Module } from '@nestjs/common'
import { TransactionController } from './transaction.controller'
import { TransactionService } from './transaction.service'
import { TransactionRepository } from './transaction.repo'
import { SepayGatewayService } from './sepay-gateway.service'

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository, SepayGatewayService],
  exports: [TransactionService, TransactionRepository, SepayGatewayService],
})
export class TransactionModule {}
