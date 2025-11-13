import { Injectable, Logger } from '@nestjs/common'
import { AdvertisementRepository } from './advertisement.repo'
import {
  CreateAdvertisementDto,
  UpdateAdvertisementDto,
  QueryAdvertisementsDto,
  CreateAdImpressionDto,
  TrackAdClickDto,
  GetActiveAdsDto,
} from './advertisement.dto'
import { AdvertisementNotFoundException, InvalidDateRangeException, NoActiveAdsException } from './advertisement.error'

@Injectable()
export class AdvertisementService {
  private readonly logger = new Logger(AdvertisementService.name)

  constructor(private readonly repository: AdvertisementRepository) {}

  async create(data: CreateAdvertisementDto) {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (endDate <= startDate) {
      throw InvalidDateRangeException
    }

    const advertisement = await this.repository.create({
      adName: data.adName,
      adType: data.adType,
      filePath: data.filePath,
      duration: data.duration,
      targetAudience: data.targetAudience,
      startDate,
      endDate,
      isActive: data.isActive,
    })

    this.logger.log(`Created advertisement ${advertisement.id}: ${advertisement.adName}`)

    return advertisement
  }

  async findAll(query: QueryAdvertisementsDto) {
    const result = await this.repository.findAll(query)

    this.logger.log(`Retrieved ${result.data.length} advertisements`)

    return result
  }

  async findById(id: number) {
    const advertisement = await this.repository.findById(id)

    if (!advertisement) {
      throw AdvertisementNotFoundException
    }

    return advertisement
  }

  async update(id: number, data: UpdateAdvertisementDto) {
    await this.findById(id)

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)

      if (endDate <= startDate) {
        throw InvalidDateRangeException
      }
    }

    const advertisement = await this.repository.update(id, {
      adName: data.adName,
      adType: data.adType,
      filePath: data.filePath,
      duration: data.duration,
      targetAudience: data.targetAudience,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      isActive: data.isActive,
    })

    this.logger.log(`Updated advertisement ${id}`)

    return advertisement
  }

  async delete(id: number) {
    await this.findById(id)

    await this.repository.delete(id)

    this.logger.log(`Deleted advertisement ${id}`)

    return {
      success: true,
      message: 'Advertisement deleted successfully',
    }
  }

  async  getActiveAds(query: GetActiveAdsDto, userId?: number) {
    const ads = await this.repository.getActiveAds(query.adType, query.limit, userId)

    if (ads.length === 0) {
      throw NoActiveAdsException
    } 

    this.logger.log(
      `Retrieved ${ads.length} active ads${query.adType ? ` of type ${query.adType}` : ''}${userId ? ` for user ${userId}` : ''}`,
    )

    return ads
  }

  async recordImpression(data: CreateAdImpressionDto) {
    const ad = await this.findById(data.adId)

    if (!ad.isActive) {
      this.logger.warn(`Attempt to record impression for inactive ad ${data.adId}`)
    }

    const impression = await this.repository.createImpression(data)

    this.logger.log(
      `Recorded impression ${impression.id} for ad ${data.adId}${data.userId ? ` by user ${data.userId}` : ''}`,
    )

    return impression
  }

  async trackClick(data: TrackAdClickDto) {
    const impression = await this.repository.trackClick(data.impressionId)

    this.logger.log(`Tracked click for impression ${data.impressionId}, ad ${impression.adId}`)

    return {
      success: true,
      message: 'Click tracked successfully',
      impression,
    }
  }

  async getAdStats(adId: number, startDate?: string, endDate?: string) {
    await this.findById(adId)

    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    const stats = await this.repository.getAdStats(adId, start, end)

    this.logger.log(`Retrieved stats for ad ${adId}`)

    return stats
  }

  async getOverallStats(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    const stats = await this.repository.getOverallStats(start, end)

    this.logger.log('Retrieved overall advertisement stats')

    return stats
  }

  async toggleActive(id: number) {
    const ad = await this.findById(id)

    const updated = await this.repository.update(id, {
      isActive: !ad.isActive,
    })

    this.logger.log(`Toggled ad ${id} active status to ${updated.isActive}`)

    return updated
  }
}
