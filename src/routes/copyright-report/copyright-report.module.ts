import { Module } from '@nestjs/common'
import { CopyrightReportController } from './copyright-report.controller'
import { CopyrightReportService } from './copyright-report.service'
import { CopyrightReportRepository } from './copyright-report.repo'

@Module({
  controllers: [CopyrightReportController],
  providers: [CopyrightReportService, CopyrightReportRepository],
  exports: [CopyrightReportService],
})
export class CopyrightReportModule {}
