import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
import { CopyrightReportService } from './copyright-report.service'
import {
  CreateCopyrightReportDto,
  UpdateReportStatusDto,
  UpdateAdminNotesDto,
  QueryCopyrightReportsDto,
  CopyrightReportResponseDto,
  CopyrightReportListResponseDto,
  CopyrightReportStatsDto,
} from './copyright-report.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import { ReporterType } from '@prisma/client'
import { AccessTokenPayloadReturn } from 'src/shared/types/jwt.type'

@Controller('copyright-reports')
export class CopyrightReportController {
  constructor(private readonly copyrightReportService: CopyrightReportService) {}

  // ==================== USER/LABEL ENDPOINTS ====================

  @Post()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(CopyrightReportResponseDto)
  async create(@Body() createDto: CreateCopyrightReportDto, @ActiveUser() user: AccessTokenPayloadReturn) {
    const reporterType = user.roleName === 'LABEL' ? ReporterType.Label : (ReporterType.Listener ?? ReporterType.System)

    return this.copyrightReportService.create(createDto, user.userId, reporterType)
  }

  @Get('my-reports')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(CopyrightReportListResponseDto)
  async getMyReports(
    @ActiveUser('userId') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1
    const limitNum = limit ? parseInt(limit, 10) : 20

    return this.copyrightReportService.findUserReports(userId, pageNum, limitNum)
  }

  @Get('my-reports/:id')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(CopyrightReportResponseDto)
  async getMyReport(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    await this.copyrightReportService.checkReportAccess(id, userId)

    return this.copyrightReportService.findById(id)
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(CopyrightReportListResponseDto)
  async findAll(@Query() query: QueryCopyrightReportsDto, @ActiveUser() user: AccessTokenPayloadReturn) {
    return this.copyrightReportService.findAll(query, user.roleName)
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(CopyrightReportStatsDto)
  async getStats(@ActiveUser() user: AccessTokenPayloadReturn) {
    return this.copyrightReportService.getStats(user.roleName)
  }

  @Get(':id')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(CopyrightReportResponseDto)
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.copyrightReportService.findById(id)
  }

  @Patch(':id/status')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(CopyrightReportResponseDto)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateReportStatusDto,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ) {
    return this.copyrightReportService.updateStatus(id, updateDto, user.roleName)
  }


  @Delete(':id')
  @Auth([AuthType.Bearer])
  async delete(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: AccessTokenPayloadReturn) {
    return this.copyrightReportService.delete(id, user.roleName)
  }
}
