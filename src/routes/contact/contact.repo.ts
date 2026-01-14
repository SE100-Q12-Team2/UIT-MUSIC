import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services'
import { CreateContactFormType, UpdateContactFormStatusType } from './contact.model'

@Injectable()
export class ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number | null, data: CreateContactFormType) {
    return this.prisma.contactForm.create({
      data: {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
        message: data.message,
        status: 'Pending',
      },
    })
  }

  async findById(id: number) {
    return this.prisma.contactForm.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })
  }

  async findAll(filters?: { status?: string; userId?: number }) {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status as any
    }

    if (filters?.userId) {
      where.userId = filters.userId
    }

    return (this.prisma as any).contactForm.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async updateStatus(id: number, data: UpdateContactFormStatusType) {
    return (this.prisma as any).contactForm.update({
      where: { id },
      data: {
        status: data.status,
      },
    })
  }

  async delete(id: number) {
    return (this.prisma as any).contactForm.delete({
      where: { id },
    })
  }
}
