import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'

export const CopyrightReportNotFoundException = new NotFoundException({
  message: 'Copyright report not found',
  error: 'Not Found',
})

export const SongNotFoundException = new NotFoundException({
  message: 'Song not found',
  error: 'Not Found',
})

export const UnauthorizedReportAccessException = new ForbiddenException({
  message: 'You do not have permission to access this report',
  error: 'Forbidden',
})

export const InvalidStatusTransitionException = new BadRequestException({
  message: 'Invalid status transition',
  error: 'Bad Request',
})

export const DuplicateReportException = new BadRequestException({
  message: 'You have already reported this song',
  error: 'Bad Request',
})

export const CannotReportOwnSongException = new ForbiddenException({
  message: 'You cannot report your own song',
  error: 'Forbidden',
})

export const ReportAlreadyResolvedException = new BadRequestException({
  message: 'This report has already been resolved',
  error: 'Bad Request',
})

export const AdminRoleRequiredException = new ForbiddenException({
  message: 'Admin role required to perform this action',
  error: 'Forbidden',
})
