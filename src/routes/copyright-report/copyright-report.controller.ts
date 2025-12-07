import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger'
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

@ApiTags('Copyright Reports')
@Controller('copyright-reports')
export class CopyrightReportController {
  private readonly logger = new Logger(CopyrightReportController.name)

  constructor(private readonly copyrightReportService: CopyrightReportService) {}

  // ==================== USER/LABEL ENDPOINTS ====================

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(CopyrightReportResponseDto)
  @ApiOperation({
    summary: 'Create copyright report',
    description: 'Submit a copyright infringement report for a song or content. Users and record labels can report unauthorized use of copyrighted material. The reporter type is automatically determined based on user role.',
  })
  @ApiBody({ type: CreateCopyrightReportDto, description: 'Copyright report details' })
  @ApiCreatedResponse({ description: 'Copyright report created successfully', type: CopyrightReportResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid report data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async create(@Body() createDto: CreateCopyrightReportDto, @ActiveUser() user: AccessTokenPayloadReturn) {
    try {
      const reporterType = user.roleName === 'LABEL' ? ReporterType.Label : (ReporterType.Listener ?? ReporterType.System)
      this.logger.log(`Create copyright report by user ${user.userId} (${reporterType})`)
      const result = await this.copyrightReportService.create(createDto, user.userId, reporterType)
      this.logger.log(`Copyright report created: ${result.id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to create copyright report for user ${user.userId}`, error.stack)
      throw error
    }
  }

  @Get('my-reports')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(CopyrightReportListResponseDto)
  @ApiOperation({
    summary: 'Get my copyright reports',
    description: 'Retrieve paginated list of copyright reports submitted by the authenticated user. Includes report status, resolution details, and timestamps.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({ description: 'User reports retrieved successfully', type: CopyrightReportListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getMyReports(
    @ActiveUser('userId') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1
      const limitNum = limit ? parseInt(limit, 10) : 20
      this.logger.log(`Get reports for user ${userId}, page: ${pageNum}, limit: ${limitNum}`)
      const result = await this.copyrightReportService.findUserReports(userId, pageNum, limitNum)
      this.logger.log(`Retrieved ${result.data.length} reports for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get reports for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get('my-reports/:id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(CopyrightReportResponseDto)
  @ApiOperation({
    summary: 'Get my copyright report by ID',
    description: 'Retrieve detailed information about a specific copyright report submitted by the authenticated user. Includes full report details and resolution status.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Copyright report ID' })
  @ApiOkResponse({ description: 'Report retrieved successfully', type: CopyrightReportResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Report not found or access denied' })
  async getMyReport(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Get report ${id} for user ${userId}`)
      await this.copyrightReportService.checkReportAccess(id, userId)
      const result = await this.copyrightReportService.findById(id)
      this.logger.log(`Report ${id} retrieved for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get report ${id} for user ${userId}`, error.stack)
      throw error
    }
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(CopyrightReportListResponseDto)
  @ApiOperation({
    summary: 'Get all copyright reports (Admin)',
    description: 'Retrieve paginated list of all copyright reports with filtering options. Admin endpoint for managing and reviewing copyright reports. Filters by status, reporter type, and date range.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by report status' })
  @ApiOkResponse({ description: 'Reports retrieved successfully', type: CopyrightReportListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: QueryCopyrightReportsDto, @ActiveUser() user: AccessTokenPayloadReturn) {
    try {
      this.logger.log(`Get all copyright reports by admin: ${user.userId}`)
      const result = await this.copyrightReportService.findAll(query, user.roleName)
      this.logger.log(`Retrieved ${result.data.length} copyright reports`)
      return result
    } catch (error) {
      this.logger.error('Failed to get all copyright reports', error.stack)
      throw error
    }
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(CopyrightReportStatsDto)
  @ApiOperation({
    summary: 'Get copyright report statistics (Admin)',
    description: 'Retrieve comprehensive statistics about copyright reports including total counts by status, resolution rates, and trends over time. Admin-only endpoint.',
  })
  @ApiOkResponse({ description: 'Statistics retrieved successfully', type: CopyrightReportStatsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getStats(@ActiveUser() user: AccessTokenPayloadReturn) {
    try {
      this.logger.log(`Get copyright report stats by admin: ${user.userId}`)
      const result = await this.copyrightReportService.getStats(user.roleName)
      this.logger.log('Copyright report stats retrieved successfully')
      return result
    } catch (error) {
      this.logger.error('Failed to get copyright report stats', error.stack)
      throw error
    }
  }

  @Get(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(CopyrightReportResponseDto)
  @ApiOperation({
    summary: 'Get copyright report by ID (Admin)',
    description: 'Retrieve detailed information about any copyright report by ID. Admin endpoint for reviewing and managing specific reports.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Copyright report ID' })
  @ApiOkResponse({ description: 'Report retrieved successfully', type: CopyrightReportResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Get copyright report by ID: ${id}`)
      const result = await this.copyrightReportService.findById(id)
      this.logger.log(`Copyright report ${id} retrieved`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get copyright report ${id}`, error.stack)
      throw error
    }
  }

  @Patch(':id/status')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(CopyrightReportResponseDto)
  @ApiOperation({
    summary: 'Update report status (Admin)',
    description: 'Update the status of a copyright report including approval, rejection, or resolution. Admin-only endpoint for managing report lifecycle and outcomes.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Copyright report ID' })
  @ApiBody({ type: UpdateReportStatusDto, description: 'Status update data' })
  @ApiOkResponse({ description: 'Report status updated successfully', type: CopyrightReportResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid status data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateReportStatusDto,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ) {
    try {
      this.logger.log(`Update status for report ${id} by admin: ${user.userId}`)
      const result = await this.copyrightReportService.updateStatus(id, updateDto, user.roleName)
      this.logger.log(`Report ${id} status updated successfully`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update status for report ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete copyright report (Admin)',
    description: 'Delete a copyright report from the system. Admin-only endpoint. This action is permanent and should be used with caution.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Copyright report ID to delete' })
  @ApiOkResponse({ description: 'Report deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  async delete(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: AccessTokenPayloadReturn) {
    try {
      this.logger.log(`Delete copyright report ${id} by admin: ${user.userId}`)
      const result = await this.copyrightReportService.delete(id, user.roleName)
      this.logger.log(`Copyright report ${id} deleted successfully`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete copyright report ${id}`, error.stack)
      throw error
    }
  }
}
