import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, Patch } from '@nestjs/common'
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

@Controller('advertisements')
export class AdvertisementController {
  constructor(private readonly advertisementService: AdvertisementService) {}

  // ==================== ADMIN ENDPOINTS ====================

  @Post()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(AdvertisementResponseDto)
  async create(@Body() createDto: CreateAdvertisementDto) {
    return this.advertisementService.create(createDto)
  }

  @Get()
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(AdvertisementListResponseDto)
  async findAll(@Query() query: QueryAdvertisementsDto) {
    return this.advertisementService.findAll(query)
  }

  @Get('stats')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(AdvertisementStatsDto)
  async getOverallStats(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.advertisementService.getOverallStats(startDate, endDate)
  }

  @Get(':id')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(AdvertisementResponseDto)
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.advertisementService.findById(id)
  }

  @Get(':id/stats')
  @Auth([AuthType.Bearer])
  async getAdStats(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.advertisementService.getAdStats(id, startDate, endDate)
  }

  @Put(':id')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(AdvertisementResponseDto)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateAdvertisementDto) {
    return this.advertisementService.update(id, updateDto)
  }

  @Patch(':id/toggle')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(AdvertisementResponseDto)
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.advertisementService.toggleActive(id)
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.advertisementService.delete(id)
  }

  // ==================== PUBLIC/USER ENDPOINTS ====================

  @Get('active/list')
  @Auth([AuthType.None, AuthType.Bearer])
  async getActiveAds(@Query() query: GetActiveAdsDto, @ActiveUser('userId') userId?: number) {
    return this.advertisementService.getActiveAds(query, userId)
  }

  @Post('impressions')
  @Auth([AuthType.None, AuthType.Bearer])
  async recordImpression(@Body() createDto: CreateAdImpressionDto, @ActiveUser('userId') userId?: number) {
    const impressionData = {
      ...createDto,
      userId: userId || createDto.userId,
    }
    return this.advertisementService.recordImpression(impressionData)
  }

  @Post('impressions/click')
  @Auth([AuthType.None, AuthType.Bearer])
  async trackClick(@Body() trackDto: TrackAdClickDto) {
    return this.advertisementService.trackClick(trackDto)
  }
}
