import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'

export const AdvertisementNotFoundException = new NotFoundException([
  {
    path: 'id',
    message: 'Error.AdvertisementNotFound',
  },
])

export const AdImpressionNotFoundException = new NotFoundException([
  {
    path: 'id',
    message: 'Error.AdImpressionNotFound',
  },
])

export const InvalidDateRangeException = new BadRequestException([
  {
    path: 'endDate',
    message: 'Error.InvalidDateRange',
  },
])

export const NoActiveAdsException = new NotFoundException([
  {
    path: 'ads',
    message: 'Error.NoActiveAds',
  },
])

export const AdvertisementExpiredException = new BadRequestException([
  {
    path: 'id',
    message: 'Error.AdvertisementExpired',
  },
])
