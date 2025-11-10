import { Module } from '@nestjs/common'
import { RecordLabelController } from './record-label.controller'
import { RecordLabelRepository } from './record-label.repo'
import { RecordLabelService } from './record-label.service'
import { PrismaService } from 'src/shared/services'

@Module({
  controllers: [RecordLabelController],
  providers: [RecordLabelService, RecordLabelRepository, PrismaService],
  exports: [RecordLabelService],
})
export class RecordLabelModule {}
