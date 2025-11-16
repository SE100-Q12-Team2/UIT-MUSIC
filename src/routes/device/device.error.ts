import { HttpException, HttpStatus } from '@nestjs/common'

export const DeviceNotFoundException = new HttpException(
  {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Error.DEVICE_NOT_FOUND',
    error: 'Not Found',
  },
  HttpStatus.NOT_FOUND,
)

export const DeviceNotOwnedException = new HttpException(
  {
    statusCode: HttpStatus.FORBIDDEN,
    message: 'Error.DEVICE_NOT_OWNED',
    error: 'Forbidden',
  },
  HttpStatus.FORBIDDEN,
)

export const CannotRevokeCurrentDeviceException = new HttpException(
  {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Error.CANNOT_REVOKE_CURRENT_DEVICE',
    error: 'Bad Request',
  },
  HttpStatus.BAD_REQUEST,
)

export const DeviceAlreadyRevokedException = new HttpException(
  {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Error.DEVICE_ALREADY_REVOKED',
    error: 'Bad Request',
  },
  HttpStatus.BAD_REQUEST,
)
