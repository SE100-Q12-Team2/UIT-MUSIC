import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'

export const NotificationNotFoundException = new NotFoundException([
  {
    path: 'id',
    message: 'Error.NotificationNotFound',
  },
])

export const NotificationAccessDeniedException = new ForbiddenException([
  {
    path: 'id',
    message: 'Error.NotificationAccessDenied',
  },
])

export const InvalidUserIdsException = new BadRequestException([
  {
    path: 'userIds',
    message: 'Error.InvalidUserIds',
  },
])

export const UserNotFoundForNotificationException = new NotFoundException([
  {
    path: 'userId',
    message: 'Error.UserNotFound',
  },
])
