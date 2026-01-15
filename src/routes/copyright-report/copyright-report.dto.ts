import { createZodDto } from 'nestjs-zod'
import {
  CreateCopyrightReportSchema,
  UpdateReportStatusSchema,
  UpdateAdminNotesSchema,
  UpdateReportReasonSchema,
  QueryCopyrightReportsSchema,
  CopyrightReportResponseSchema,
  CopyrightReportListResponseSchema,
  CopyrightReportStatsSchema,
} from './copyright-report.model'

export class CreateCopyrightReportDto extends createZodDto(CreateCopyrightReportSchema) {}
export class UpdateReportStatusDto extends createZodDto(UpdateReportStatusSchema) {}
export class UpdateAdminNotesDto extends createZodDto(UpdateAdminNotesSchema) {}
export class UpdateReportReasonDto extends createZodDto(UpdateReportReasonSchema) {}
export class QueryCopyrightReportsDto extends createZodDto(QueryCopyrightReportsSchema) {}

export class CopyrightReportResponseDto extends createZodDto(CopyrightReportResponseSchema) {}
export class CopyrightReportListResponseDto extends createZodDto(CopyrightReportListResponseSchema) {}
export class CopyrightReportStatsDto extends createZodDto(CopyrightReportStatsSchema) {}
