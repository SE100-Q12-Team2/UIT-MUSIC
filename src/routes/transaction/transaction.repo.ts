import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma, TransactionStatus } from '@prisma/client'
import { QueryTransactionDto, UpdateTransactionStatusDto } from './transaction.dto'

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: number
    subscriptionId?: number
    amount: number
    paymentMethodId: number
    transactionStatus?: TransactionStatus
    transactionReference?: string
    invoiceData?: any
  }) {
    const transaction = await this.prisma.transaction.create({
      data: {
        userId: data.userId,
        subscriptionId: data.subscriptionId,
        amount: new Prisma.Decimal(data.amount),
        paymentMethodId: data.paymentMethodId,
        transactionStatus: data.transactionStatus || TransactionStatus.Pending,
        transactionReference: data.transactionReference,
        invoiceData: data.invoiceData,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        subscription: {
          select: {
            id: true,
            planId: true,
          },
        },
        paymentMethod: {
          select: {
            id: true,
            methodName: true,
          },
        },
      },
    })

    return {
      ...transaction,
      amount: Number(transaction.amount),
    }
  }

  async findAll(query: QueryTransactionDto) {
    const { page, limit, status, userId, subscriptionId, fromDate, toDate } = query
    const skip = (page - 1) * limit

    const where: Prisma.TransactionWhereInput = {
      ...(status && { transactionStatus: status as TransactionStatus }),
      ...(userId && { userId }),
      ...(subscriptionId && { subscriptionId }),
      ...(fromDate &&
        toDate && {
          createdAt: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        }),
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          subscription: {
            select: {
              id: true,
              planId: true,
            },
          },
          paymentMethod: {
            select: {
              id: true,
              methodName: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ])

    return {
      data: data.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        subscription: {
          select: {
            id: true,
            planId: true,
          },
        },
        paymentMethod: {
          select: {
            id: true,
            methodName: true,
          },
        },
      },
    })

    if (!transaction) {
      return null
    }

    return {
      ...transaction,
      amount: Number(transaction.amount),
    }
  }

  async findByReference(reference: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { transactionReference: reference },
      include: {
        user: true,
        subscription: true,
        paymentMethod: true,
      },
    })

    if (!transaction) {
      return null
    }

    return {
      ...transaction,
      amount: Number(transaction.amount),
    }
  }

  async updateStatus(id: number, data: UpdateTransactionStatusDto) {
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        transactionStatus: data.transactionStatus,
        transactionReference: data.transactionReference,
        invoiceData: data.invoiceData,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        subscription: {
          select: {
            id: true,
            planId: true,
          },
        },
        paymentMethod: {
          select: {
            id: true,
            methodName: true,
          },
        },
      },
    })

    return {
      ...transaction,
      amount: Number(transaction.amount),
    }
  }

  async getStats() {
    const [total, pending, completed, failed, refunded] = await Promise.all([
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { transactionStatus: TransactionStatus.Pending } }),
      this.prisma.transaction.count({ where: { transactionStatus: TransactionStatus.Completed } }),
      this.prisma.transaction.count({ where: { transactionStatus: TransactionStatus.Failed } }),
      this.prisma.transaction.count({ where: { transactionStatus: TransactionStatus.Refunded } }),
    ])

    const [completedSum, refundedSum] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { transactionStatus: TransactionStatus.Completed },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { transactionStatus: TransactionStatus.Refunded },
        _sum: { amount: true },
      }),
    ])

    const totalSum = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
    })

    return {
      total,
      pending,
      completed,
      failed,
      refunded,
      totalAmount: Number(totalSum._sum.amount || 0),
      completedAmount: Number(completedSum._sum.amount || 0),
      refundedAmount: Number(refundedSum._sum.amount || 0),
    }
  }

  async findByUserId(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          subscription: {
            select: {
              id: true,
              planId: true,
            },
          },
          paymentMethod: {
            select: {
              id: true,
              methodName: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ])

    return {
      data: data.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findSubscriptionById(subscriptionId: number) {
    return this.prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
    })
  }

  async findPaymentMethodById(paymentMethodId: number) {
    return this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    })
  }

  async updateSubscriptionStatus(subscriptionId: number, isActive: boolean) {
    return this.prisma.userSubscription.update({
      where: { id: subscriptionId },
      data: { isActive },
    })
  }
}
