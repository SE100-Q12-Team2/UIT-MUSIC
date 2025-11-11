import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma } from '@prisma/client'
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, QueryPaymentMethodDto } from './payment-method.dto'
import { PaymentMethod } from './payment-method.model'

@Injectable()
export class PaymentMethodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        methodName: data.methodName,
        isActive: data.isActive ?? true,
      },
    })

    return paymentMethod
  }

  async findAll(query: QueryPaymentMethodDto) {
    const { page, limit, isActive, search } = query
    const skip = (page - 1) * limit

    const where: Prisma.PaymentMethodWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        methodName: {
          contains: search,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.paymentMethod.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          id: 'asc',
        },
      }),
      this.prisma.paymentMethod.count({ where }),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: number): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findUnique({
      where: { id },
    })
  }

  async findByName(methodName: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findFirst({
      where: {
        methodName: {
          equals: methodName,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      },
    })
  }

  async update(id: number, data: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.update({
      where: { id },
      data,
    })
  }

  async delete(id: number): Promise<void> {
    await this.prisma.paymentMethod.delete({
      where: { id },
    })
  }

  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.paymentMethod.count(),
      this.prisma.paymentMethod.count({ where: { isActive: true } }),
      this.prisma.paymentMethod.count({ where: { isActive: false } }),
    ])

    return {
      total,
      active,
      inactive,
    }
  }

  async hasTransactions(id: number): Promise<boolean> {
    const count = await this.prisma.transaction.count({
      where: { paymentMethodId: id },
    })
    return count > 0
  }
}
