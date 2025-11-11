import { BadRequestException, NotFoundException } from '@nestjs/common'

export const PaymentMethodNotFoundError = (id: number) =>
  new NotFoundException([
    {
      path: ['id'],
      message: `Payment method with ID ${id} not found`,
    },
  ])

export const PaymentMethodAlreadyExistsError = (methodName: string) =>
  new BadRequestException([
    {
      path: ['methodName'],
      message: `Payment method '${methodName}' already exists`,
    },
  ])

export const InvalidPaymentMethodIdError = (id: string | number) =>
  new BadRequestException([
    {
      path: ['id'],
      message: `Invalid payment method ID: ${id}`,
    },
  ])

export const PaymentMethodHasTransactionsError = (id: number) =>
  new BadRequestException([
    {
      path: ['id'],
      message: `Cannot delete payment method with ID ${id} because it has associated transactions`,
    },
  ])
