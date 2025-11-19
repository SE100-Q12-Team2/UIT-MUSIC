import { z } from 'zod'
import { ReporterType, ReportStatus } from '@prisma/client'

export const ReporterTypeEnum = z.nativeEnum(ReporterType)
export const ReportStatusEnum = z.nativeEnum(ReportStatus)

export const CopyrightReportSchema = z.object({
  id: z.number().int().positive(),
  songId: z.number().int().positive(),
  reporterType: ReporterTypeEnum,
  reporterId: z.number().int().positive().nullable(),
  reportReason: z.string(),
  status: ReportStatusEnum,
  adminNotes: z.string().nullable(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
})

export const CreateCopyrightReportSchema = z.object({
  songId: z.number().int().positive(),
  reportReason: z.string().min(10).max(2000),
})

export const UpdateReportStatusSchema = z.object({
  status: ReportStatusEnum,
  adminNotes: z.string().min(1).max(5000).optional(),
})

export const UpdateAdminNotesSchema = z.object({
  adminNotes: z.string().min(1).max(5000),
})

export const QueryCopyrightReportsSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10)),
  status: ReportStatusEnum.optional(),
  reporterType: ReporterTypeEnum.optional(),
  songId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  reporterId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
})

export const CopyrightReportResponseSchema = CopyrightReportSchema.extend({
  song: z
    .object({
      id: z.number().int().positive(),
      title: z.string(),
      artist: z.string().optional(),
    })
    .optional(),
  reporter: z
    .object({
      id: z.number().int().positive(),
      fullName: z.string(),
      email: z.string(),
    })
    .optional()
    .nullable(),
})

export const CopyrightReportListResponseSchema = z.object({
  data: z.array(CopyrightReportResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export const CopyrightReportStatsSchema = z.object({
  totalReports: z.number().int().nonnegative(),
  pendingReports: z.number().int().nonnegative(),
  underReviewReports: z.number().int().nonnegative(),
  resolvedReports: z.number().int().nonnegative(),
  dismissedReports: z.number().int().nonnegative(),
  reportsByType: z.object({
    System: z.number().int().nonnegative(),
    Listener: z.number().int().nonnegative(),
    Label: z.number().int().nonnegative(),
    External: z.number().int().nonnegative(),
  }),
})

export type CopyrightReport = z.infer<typeof CopyrightReportSchema>
export type CreateCopyrightReportDto = z.infer<typeof CreateCopyrightReportSchema>
export type UpdateReportStatusDto = z.infer<typeof UpdateReportStatusSchema>
export type UpdateAdminNotesDto = z.infer<typeof UpdateAdminNotesSchema>
export type QueryCopyrightReportsDto = z.infer<typeof QueryCopyrightReportsSchema>
export type CopyrightReportResponse = z.infer<typeof CopyrightReportResponseSchema>
export type CopyrightReportListResponse = z.infer<typeof CopyrightReportListResponseSchema>
export type CopyrightReportStats = z.infer<typeof CopyrightReportStatsSchema>
