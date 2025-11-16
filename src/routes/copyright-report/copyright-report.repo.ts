import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma, ReporterType, ReportStatus } from '@prisma/client'
import { QueryCopyrightReportsDto } from './copyright-report.model'
import { CopyrightReportNotFoundException } from './copyright-report.error'

@Injectable()
export class CopyrightReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { songId: number; reporterType: ReporterType; reporterId: number | null; reportReason: string }) {
    return this.prisma.copyrightReport.create({
      data: {
        songId: data.songId,
        reporterType: data.reporterType,
        reporterId: data.reporterId,
        reportReason: data.reportReason,
        status: ReportStatus.Pending,
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            songArtists: {
              select: {
                artist: {
                  select: {
                    artistName: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })
  }

  async findAll(query: QueryCopyrightReportsDto) {
    const { page, limit, status, reporterType, songId, reporterId } = query
    const skip = (page - 1) * limit

    const where: Prisma.CopyrightReportWhereInput = {
      ...(status && { status }),
      ...(reporterType && { reporterType }),
      ...(songId && { songId }),
      ...(reporterId && { reporterId }),
    }

    const [data, total] = await Promise.all([
      this.prisma.copyrightReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          song: {
            select: {
              id: true,
              title: true,
              songArtists: {
                select: {
                  artist: {
                    select: {
                      artistName: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
          reporter: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.copyrightReport.count({ where }),
    ])

    const transformedData = data.map((report) => ({
      ...report,
      song: report.song
        ? {
            id: report.song.id,
            title: report.song.title,
            artist: report.song.songArtists[0]?.artist.artistName,
          }
        : undefined,
    }))

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: number) {
    const report = await this.prisma.copyrightReport.findUnique({
      where: { id },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            songArtists: {
              select: {
                artist: {
                  select: {
                    artistName: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    if (!report) {
      return null
    }

    return {
      ...report,
      song: report.song
        ? {
            id: report.song.id,
            title: report.song.title,
            artist: report.song.songArtists[0]?.artist.artistName,
          }
        : undefined,
    }
  }

  async findByUserAndSong(userId: number, songId: number) {
    return this.prisma.copyrightReport.findFirst({
      where: {
        reporterId: userId,
        songId,
        status: {
          in: [ReportStatus.Pending, ReportStatus.UnderReview],
        },
      },
    })
  }

  async findUserReports(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const where: Prisma.CopyrightReportWhereInput = {
      reporterId: userId,
    }

    const [data, total] = await Promise.all([
      this.prisma.copyrightReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          song: {
            select: {
              id: true,
              title: true,
              songArtists: {
                select: {
                  artist: {
                    select: {
                      artistName: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.copyrightReport.count({ where }),
    ])

    const transformedData = data.map((report) => ({
      ...report,
      song: report.song
        ? {
            id: report.song.id,
            title: report.song.title,
            artist: report.song.songArtists[0]?.artist.artistName,
          }
        : undefined,
      reporter: undefined, 
    }))

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async updateStatus(id: number, status: ReportStatus, adminNotes?: string) {
    try {
      const updateData: Prisma.CopyrightReportUpdateInput = {
        status,
        ...(adminNotes && { adminNotes }),
        ...(status === ReportStatus.Resolved || status === ReportStatus.Dismissed ? { resolvedAt: new Date() } : {}),
      }

      return await this.prisma.copyrightReport.update({
        where: { id },
        data: updateData,
        include: {
          song: {
            select: {
              id: true,
              title: true,
              songArtists: {
                select: {
                  artist: {
                    select: {
                      artistName: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
          reporter: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw CopyrightReportNotFoundException
        }
      }
      throw error
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.copyrightReport.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw CopyrightReportNotFoundException
        }
      }
      throw error
    }
  }

  async getStats() {
    const [totalReports, statusCounts, typeCounts] = await Promise.all([
      this.prisma.copyrightReport.count(),
      this.prisma.copyrightReport.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      }),
      this.prisma.copyrightReport.groupBy({
        by: ['reporterType'],
        _count: {
          id: true,
        },
      }),
    ])

    const statusMap = {
      Pending: 0,
      UnderReview: 0,
      Resolved: 0,
      Dismissed: 0,
    }

    statusCounts.forEach((item) => {
      statusMap[item.status] = item._count.id
    })

    const typeMap = {
      System: 0,
      Listener: 0,
      Label: 0,
      External: 0,
    }

    typeCounts.forEach((item) => {
      typeMap[item.reporterType] = item._count.id
    })

    return {
      totalReports,
      pendingReports: statusMap.Pending,
      underReviewReports: statusMap.UnderReview,
      resolvedReports: statusMap.Resolved,
      dismissedReports: statusMap.Dismissed,
      reportsByType: typeMap,
    }
  }

  async checkSongExists(songId: number) {
    const song = await this.prisma.song.findUnique({
      where: { id: songId },
      select: { id: true, labelId: true },
    })
    return song
  }
}
