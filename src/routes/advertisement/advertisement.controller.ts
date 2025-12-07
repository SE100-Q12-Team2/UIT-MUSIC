import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, Patch, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger'
import { AdvertisementService } from './advertisement.service'
import {
  CreateAdvertisementDto,
  UpdateAdvertisementDto,
  QueryAdvertisementsDto,
  CreateAdImpressionDto,
  TrackAdClickDto,
  GetActiveAdsDto,
  AdvertisementResponseDto,
  AdvertisementListResponseDto,
  AdvertisementStatsDto,
} from './advertisement.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'

@ApiTags('Advertisements')
@Controller('advertisements')
export class AdvertisementController {
  private readonly logger = new Logger(AdvertisementController.name)

  constructor(private readonly advertisementService: AdvertisementService) {}

  // ==================== ADMIN ENDPOINTS ====================

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(AdvertisementResponseDto)
  @ApiOperation({
    summary: 'Create advertisement',
    description: 'Create a new advertisement with title, content, media, target criteria, and schedule. Requires admin authentication.',
  })
  @ApiBody({ type: CreateAdvertisementDto, description: 'Advertisement creation data' })
  @ApiCreatedResponse({ description: 'Advertisement created successfully', type: AdvertisementResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid advertisement data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async create(@Body() createDto: CreateAdvertisementDto) {
    try {
      const result = await this.advertisementService.create(createDto)
      this.logger.log(`Advertisement created: ${result.id}`)
      return result
    } catch (error) {
      this.logger.error('Failed to create advertisement', error.stack)
      throw error
    }
  }

  @Get()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(AdvertisementListResponseDto)
  @ApiOperation({
    summary: 'Get all advertisements',
    description: 'Retrieve paginated list of advertisements with optional filtering by status, type, and placement. Admin only.',
  })
  @ApiOkResponse({ description: 'Advertisements retrieved successfully', type: AdvertisementListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async findAll(@Query() query: QueryAdvertisementsDto) {
    try {
      this.logger.log(`Get all advertisements with query: ${JSON.stringify(query)}`)
      const result = await this.advertisementService.findAll(query)
      this.logger.log(`Retrieved ${result.data.length} advertisements`)
      return result
    } catch (error) {
      this.logger.error('Failed to get advertisements', error.stack)
      throw error
    }
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(AdvertisementStatsDto)
  @ApiOperation({
    summary: 'Get overall ad statistics',
    description: 'Retrieve aggregate statistics for all advertisements including impressions, clicks, and CTR. Admin only.',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for stats (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for stats (ISO format)' })
  @ApiOkResponse({ description: 'Statistics retrieved successfully', type: AdvertisementStatsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async getOverallStats(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    try {
      this.logger.log(`Get overall ad stats: ${startDate} to ${endDate}`)
      const result = await this.advertisementService.getOverallStats(startDate, endDate)
      this.logger.log('Overall stats retrieved')
      return result
    } catch (error) {
      this.logger.error('Failed to get overall stats', error.stack)
      throw error
    }
  }

  @Get(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(AdvertisementResponseDto)
  @ApiOperation({
    summary: 'Get advertisement by ID',
    description: 'Retrieve detailed information about a specific advertisement. Admin only.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Advertisement ID' })
  @ApiOkResponse({ description: 'Advertisement found', type: AdvertisementResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Get advertisement by ID: ${id}`)
      const result = await this.advertisementService.findById(id)
      this.logger.log(`Advertisement retrieved: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get advertisement ${id}`, error.stack)
      throw error
    }
  }

  @Get(':id/stats')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get advertisement statistics',
    description: 'Retrieve detailed statistics for a specific advertisement including impressions, clicks, and performance metrics. Admin only.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Advertisement ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiOkResponse({ description: 'Advertisement statistics retrieved' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  async getAdStats(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      this.logger.log(`Get stats for ad ${id}: ${startDate} to ${endDate}`)
      const result = await this.advertisementService.getAdStats(id, startDate, endDate)
      this.logger.log(`Stats retrieved for ad ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get stats for ad ${id}`, error.stack)
      throw error
    }
  }

  @Put(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(AdvertisementResponseDto)
  @ApiOperation({
    summary: 'Update advertisement',
    description: 'Update advertisement details including title, content, media, targeting, and schedule. Admin only.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Advertisement ID' })
  @ApiBody({ type: UpdateAdvertisementDto, description: 'Updated advertisement fields' })
  @ApiOkResponse({ description: 'Advertisement updated successfully', type: AdvertisementResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid advertisement data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateAdvertisementDto) {
    try {
      this.logger.log(`Update advertisement: ${id}`)
      const result = await this.advertisementService.update(id, updateDto)
      this.logger.log(`Advertisement updated: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update advertisement ${id}`, error.stack)
      throw error
    }
  }

  @Patch(':id/toggle')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(AdvertisementResponseDto)
  @ApiOperation({
    summary: 'Toggle advertisement active status',
    description: 'Enable or disable an advertisement. Admin only.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Advertisement ID' })
  @ApiOkResponse({ description: 'Advertisement status toggled', type: AdvertisementResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Toggle advertisement status: ${id}`)
      const result = await this.advertisementService.toggleActive(id)
      this.logger.log(`Advertisement toggled: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to toggle advertisement ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete advertisement',
    description: 'Soft delete an advertisement. Admin only.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Advertisement ID' })
  @ApiOkResponse({ description: 'Advertisement deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Delete advertisement: ${id}`)
      const result = await this.advertisementService.delete(id)
      this.logger.log(`Advertisement deleted: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete advertisement ${id}`, error.stack)
      throw error
    }
  }

  // ==================== PUBLIC/USER ENDPOINTS ====================

  @Get('active/list')
  @Auth([AuthType.None, AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active advertisements',
    description: 'Retrieve list of currently active advertisements based on user targeting and placement. Public access.',
  })
  @ApiOkResponse({ description: 'Active advertisements retrieved' })
  async getActiveAds(@Query() query: GetActiveAdsDto, @ActiveUser('userId') userId?: number) {
    try {
      this.logger.log(`Get active ads: ${JSON.stringify(query)}`)
      const result = await this.advertisementService.getActiveAds(query, userId)
      this.logger.log('Active ads retrieved')
      return result
    } catch (error) {
      this.logger.error('Failed to get active ads', error.stack)
      throw error
    }
  }

  @Post('impressions')
  @Auth([AuthType.None, AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record advertisement impression',
    description: 'Track when an advertisement is displayed to a user. Public access.',
  })
  @ApiBody({ type: CreateAdImpressionDto, description: 'Impression tracking data' })
  @ApiCreatedResponse({ description: 'Impression recorded successfully' })
  async recordImpression(@Body() createDto: CreateAdImpressionDto, @ActiveUser('userId') userId?: number) {
    try {
      const impressionData = {
        ...createDto,
        userId: userId || createDto.userId,
      }
      this.logger.log('Record advertisement impression')
      const result = await this.advertisementService.recordImpression(impressionData)
      return result
    } catch (error) {
      this.logger.error('Failed to record impression', error.stack)
      throw error
    }
  }

  @Post('impressions/click')
  @Auth([AuthType.None, AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track advertisement click',
    description: 'Record when a user clicks on an advertisement. Public access.',
  })
  @ApiBody({ type: TrackAdClickDto, description: 'Click tracking data' })
  @ApiCreatedResponse({ description: 'Click tracked successfully' })
  async trackClick(@Body() trackDto: TrackAdClickDto) {
    try {
      this.logger.log(`Track click for impression ${trackDto.impressionId}`)
      const result = await this.advertisementService.trackClick(trackDto)
      return result
    } catch (error) {
      this.logger.error('Failed to track click', error.stack)
      throw error
    }
  }
}
