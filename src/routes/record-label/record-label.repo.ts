import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { GetRecordLabelsQueryType, CreateRecordLabelType, UpdateRecordLabelType } from './record-label.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class RecordLabelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetRecordLabelsQueryType) {
    const { page, limit, search, hasPublicProfile, userId } = query
    const skip = (page - 1) * limit

    const conditions: Prisma.RecordLabelWhereInput = {
      ...(typeof hasPublicProfile === 'boolean' && { hasPublicProfile }),
      ...(userId && { userId }),
      ...(search && {
        OR: [
          { labelName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [items, total] = await Promise.all([
      this.prisma.recordLabel.findMany({
        where: conditions,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              albums: true,
              songs: true,
            },
          },
        },
      }),
      this.prisma.recordLabel.count({ where: conditions }),
    ])

    return {
      items,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    }
  }

  async findById(id: number) {
    const label = await this.prisma.recordLabel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            albums: true,
            songs: true,
          },
        },
      },
    })

    if (!label) {
      throw new NotFoundException(`Record label with ID ${id} not found`)
    }

    return label
  }

  async findByUserId(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    const label = await this.prisma.recordLabel.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            albums: true,
            songs: true,
          },
        },
      },
    })

    if (!label) {
      throw new NotFoundException(`Record label for user ID ${userId} not found`)
    }

    return label
  }

  async create(userId: number, data: CreateRecordLabelType) {
    const existingLabel = await this.prisma.recordLabel.findUnique({
      where: { userId },
    })

    if (existingLabel) {
      throw new ConflictException('User already has a record label')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return this.prisma.recordLabel.create({
      data: {
        ...data,
        user: {
          connect: { id: userId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            albums: true,
            songs: true,
          },
        },
      },
    })
  }

  async update(id: number, userId: number, data: UpdateRecordLabelType) {
    const label = await this.findById(id)

    if (label.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this record label')
    }

    return this.prisma.recordLabel.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            albums: true,
            songs: true,
          },
        },
      },
    })
  }

  async delete(id: number, userId: number) {
    const label = await this.findById(id)

    if (label.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this record label')
    }

    if (label._count && (label._count.albums > 0 || label._count.songs > 0)) {
      throw new ForbiddenException(
        'Cannot delete record label with existing albums or songs. Please remove them first.',
      )
    }

    await this.prisma.recordLabel.delete({ where: { id } })

    return {
      id,
      message: 'Record label deleted successfully',
    }
  }
}
