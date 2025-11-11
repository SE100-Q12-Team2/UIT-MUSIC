import { Injectable } from '@nestjs/common'
import { PaymentMethodRepository } from './payment-method.repo'
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, QueryPaymentMethodDto } from './payment-method.dto'
import {
  PaymentMethodNotFoundError,
  PaymentMethodAlreadyExistsError,
  PaymentMethodHasTransactionsError,
} from './payment-method.error'
import { isNotFoundPrismaError } from 'src/shared/lib'

@Injectable()
export class PaymentMethodService {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async create(data: CreatePaymentMethodDto) {
    const existing = await this.repository.findByName(data.methodName)
    if (existing) {
      throw PaymentMethodAlreadyExistsError(data.methodName)
    }

    return this.repository.create(data)
  }

  async findAll(query: QueryPaymentMethodDto) {
    return this.repository.findAll(query)
  }

  async findById(id: number) {
    const paymentMethod = await this.repository.findById(id)
    if (!paymentMethod) {
      throw PaymentMethodNotFoundError(id)
    }
    return paymentMethod
  }

  async update(id: number, data: UpdatePaymentMethodDto) {
    await this.findById(id)

    if (data.methodName) {
      const existing = await this.repository.findByName(data.methodName)
      if (existing && existing.id !== id) {
        throw PaymentMethodAlreadyExistsError(data.methodName)
      }
    }

    try {
      return await this.repository.update(id, data)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw PaymentMethodNotFoundError(id)
      }
      throw error
    }
  }

  async delete(id: number) {
    await this.findById(id)

    const hasTransactions = await this.repository.hasTransactions(id)
    if (hasTransactions) {
      throw PaymentMethodHasTransactionsError(id)
    }

    try {
      await this.repository.delete(id)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw PaymentMethodNotFoundError(id)
      }
      throw error
    }
  }

  async getStats() {
    return this.repository.getStats()
  }
}
