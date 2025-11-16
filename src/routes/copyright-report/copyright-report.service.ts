import { Injectable, Logger } from '@nestjs/common'
import { CopyrightReportRepository } from './copyright-report.repo'
import { ReporterType, ReportStatus } from '@prisma/client'
import {
  CreateCopyrightReportDto,
  UpdateReportStatusDto,
  UpdateAdminNotesDto,
  QueryCopyrightReportsDto,
} from './copyright-report.dto'
import {
  CopyrightReportNotFoundException,
  SongNotFoundException,
  UnauthorizedReportAccessException,
  InvalidStatusTransitionException,
  DuplicateReportException,
  CannotReportOwnSongException,
  ReportAlreadyResolvedException,
  AdminRoleRequiredException,
} from './copyright-report.error'

@Injectable()
export class CopyrightReportService {
  private readonly logger = new Logger(CopyrightReportService.name)

  constructor(private readonly repository: CopyrightReportRepository) {}

  async create(data: CreateCopyrightReportDto, userId: number, reporterType: ReporterType) {
    const song = await this.repository.checkSongExists(data.songId)
    if (!song) {
      throw SongNotFoundException
    }

    if (reporterType === ReporterType.Label) {
      const userLabel = await this.repository['prisma'].recordLabel.findUnique({
        where: { userId },
        select: { id: true },
      })

      if (userLabel && song.labelId === userLabel.id) {
        throw CannotReportOwnSongException
      }
    }

    const existingReport = await this.repository.findByUserAndSong(userId, data.songId)
    if (existingReport) {
      throw DuplicateReportException
    }

    const report = await this.repository.create({
      songId: data.songId,
      reporterType,
      reporterId: userId,
      reportReason: data.reportReason,
    })

    this.logger.log(`Created copyright report ${report.id} for song ${data.songId} by user ${userId}`)

    return report
  }

  async findAll(query: QueryCopyrightReportsDto, roleName?: string) {
    if (roleName !== 'ADMIN') {
      throw AdminRoleRequiredException
    }

    const result = await this.repository.findAll(query)

    this.logger.log(`Retrieved ${result.data.length} copyright reports`)

    return result
  }

  async findById(id: number) {
    const report = await this.repository.findById(id)

    if (!report) {
      throw CopyrightReportNotFoundException
    }

    return report
  }

  async findUserReports(userId: number, page: number = 1, limit: number = 20) {
    const result = await this.repository.findUserReports(userId, page, limit)

    this.logger.log(`Retrieved ${result.data.length} reports for user ${userId}`)

    return result
  }

  async updateStatus(id: number, data: UpdateReportStatusDto, roleName?: string) {
    if (roleName !== 'ADMIN') {
      throw AdminRoleRequiredException
    }

    const report = await this.repository.findById(id)

    if (!report) {
      throw CopyrightReportNotFoundException
    }

    if (report.status === ReportStatus.Resolved || report.status === ReportStatus.Dismissed) {
      throw ReportAlreadyResolvedException
    }

    this.validateStatusTransition(report.status, data.status)

    const updated = await this.repository.updateStatus(id, data.status, data.adminNotes)

    this.logger.log(`Updated report ${id} status from ${report.status} to ${data.status}`)

    if (data.status === ReportStatus.Resolved) {
      await this.updateSongCopyrightStatus(report.songId)
    }

    return updated
  }

  async delete(id: number, roleName?: string) {
    if (roleName !== 'ADMIN') {
      throw AdminRoleRequiredException
    }

    const report = await this.repository.findById(id)

    if (!report) {
      throw CopyrightReportNotFoundException
    }

    await this.repository.delete(id)

    this.logger.log(`Deleted copyright report ${id}`)

    return {
      success: true,
      message: 'Copyright report deleted successfully',
    }
  }

  async getStats(roleName?: string) {
    if (roleName !== 'ADMIN') {
      throw AdminRoleRequiredException
    }

    const stats = await this.repository.getStats()

    this.logger.log('Retrieved copyright report statistics')

    return stats
  }

  async checkReportAccess(reportId: number, userId: number): Promise<boolean> {
    const report = await this.repository.findById(reportId)

    if (!report) {
      throw CopyrightReportNotFoundException
    }

    if (report.reporterId !== userId) {
      throw UnauthorizedReportAccessException
    }

    return true
  }

  private validateStatusTransition(currentStatus: ReportStatus, newStatus: ReportStatus) {
    const validTransitions: Record<ReportStatus, ReportStatus[]> = {
      [ReportStatus.Pending]: [ReportStatus.UnderReview, ReportStatus.Dismissed],
      [ReportStatus.UnderReview]: [ReportStatus.Resolved, ReportStatus.Dismissed],
      [ReportStatus.Resolved]: [],
      [ReportStatus.Dismissed]: [],
    }

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw InvalidStatusTransitionException
    }
  }

  private async updateSongCopyrightStatus(songId: number) {
    try {
      await this.repository['prisma'].song.update({
        where: { id: songId },
        data: {
          copyrightStatus: 'Violation',
          isActive: false,
        },
      })

      this.logger.warn(`Song ${songId} marked as copyright violation and deactivated`)
    } catch (error) {
      this.logger.error(`Failed to update song ${songId} copyright status:`, error)
    }
  }
}
