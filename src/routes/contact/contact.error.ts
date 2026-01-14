import { HttpException, HttpStatus } from '@nestjs/common'

export const ContactFormNotFoundException = new HttpException(
  {
    success: false,
    errorCode: HttpStatus.NOT_FOUND,
    message: 'Contact form not found',
    timestamp: new Date().toISOString(),
  },
  HttpStatus.NOT_FOUND,
)

export const ContactFormCreationException = new HttpException(
  {
    success: false,
    errorCode: HttpStatus.BAD_REQUEST,
    message: 'Failed to create contact form',
    timestamp: new Date().toISOString(),
  },
  HttpStatus.BAD_REQUEST,
)
