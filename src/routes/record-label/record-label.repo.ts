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
          parentLabel: {
            select: {
              id: true,
              labelName: true,
              labelType: true,
            },
          },
          managedArtists: {
            select: {
              id: true,
              labelName: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              albums: true,
              songs: true,
              managedArtists: true,
            },
          },
        },
      }),
      this.prisma.recordLabel.count({ where: conditions }),
    ])

    return {
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
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
        parentLabel: {
          select: {
            id: true,
            labelName: true,
            labelType: true,
          },
        },
        managedArtists: {
          select: {
            id: true,
            labelName: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            albums: true,
            songs: true,
            managedArtists: true,
          },
        },
      },
    })

    if (!label) {
      throw new NotFoundException(`Record label with ID ${id} not found`)
    }

    return {
      ...label,
      createdAt: label.createdAt.toISOString(),
    }
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
        parentLabel: {
          select: {
            id: true,
            labelName: true,
            labelType: true,
          },
        },
        managedArtists: {
          select: {
            id: true,
            labelName: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            albums: true,
            songs: true,
            managedArtists: true,
          },
        },
      },
    })

    if (!label) {
      throw new NotFoundException(`Record label for user ID ${userId} not found`)
    }

    return {
      ...label,
      createdAt: label.createdAt.toISOString(),
    }
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

    const { parentLabelId, ...rest } = data
    const createData: any = {
      ...rest,
      user: {
        connect: { id: userId },
      },
    }
    
    if (parentLabelId !== null && parentLabelId !== undefined) {
      createData.parentLabelId = parentLabelId
    }

    const label = await this.prisma.recordLabel.create({
      data: createData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        parentLabel: {
          select: {
            id: true,
            labelName: true,
            labelType: true,
          },
        },
        managedArtists: {
          select: {
            id: true,
            labelName: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            albums: true,
            songs: true,
            managedArtists: true,
          },
        },
      },
    })

    return {
      ...label,
      createdAt: label.createdAt.toISOString(),
    }
  }

  async update(id: number, userId: number, data: UpdateRecordLabelType) {
    const label = await this.findById(id)

    if (label.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this record label')
    }

    const updateData: any = { ...data }
    if ('parentLabelId' in updateData && updateData.parentLabelId === null) {
      updateData.parentLabelId = undefined
    }
    if ('imageUrl' in updateData && updateData.imageUrl === null) {
      updateData.imageUrl = undefined
    }

    const updatedLabel = await this.prisma.recordLabel.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        parentLabel: {
          select: {
            id: true,
            labelName: true,
            labelType: true,
          },
        },
        managedArtists: {
          select: {
            id: true,
            labelName: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            albums: true,
            songs: true,
            managedArtists: true,
          },
        },
      },
    })

    return {
      ...updatedLabel,
      createdAt: updatedLabel.createdAt.toISOString(),
    }
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

  async getManagedArtists(companyId: number, query: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = query
    const skip = (page - 1) * limit

    const company = await this.prisma.recordLabel.findUnique({
      where: { id: companyId },
      select: { labelType: true },
    })

    if (!company) {
      throw new NotFoundException(`Record label with ID ${companyId} not found`)
    }

    if (company.labelType !== 'COMPANY') {
      throw new ForbiddenException('Only companies can have managed artists')
    }

    const conditions: Prisma.RecordLabelWhereInput = {
      parentLabelId: companyId,
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
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    }
  }

  async addArtistToCompany(companyId: number, artistLabelId: number, userId: number) {
    const company = await this.prisma.recordLabel.findUnique({
      where: { id: companyId },
      select: { userId: true, labelType: true },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`)
    }

    if (company.userId !== userId) {
      throw new ForbiddenException('You do not have permission to manage this company')
    }

    if (company.labelType !== 'COMPANY') {
      throw new ForbiddenException('Only companies can manage artists')
    }

    const artist = await this.prisma.recordLabel.findUnique({
      where: { id: artistLabelId },
      select: { labelType: true, parentLabelId: true },
    })

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${artistLabelId} not found`)
    }

    if (artist.labelType !== 'INDIVIDUAL') {
      throw new ForbiddenException('Can only manage individual artists')
    }

    if (artist.parentLabelId !== null) {
      throw new ConflictException('Artist is already managed by another company')
    }

    await this.prisma.recordLabel.update({
      where: { id: artistLabelId },
      data: { parentLabelId: companyId },
    })

    return {
      message: 'Artist added to company successfully',
      companyId,
      artistLabelId,
    }
  }

  async removeArtistFromCompany(companyId: number, artistLabelId: number, userId: number) {
    const company = await this.prisma.recordLabel.findUnique({
      where: { id: companyId },
      select: { userId: true, labelType: true },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`)
    }

    if (company.userId !== userId) {
      throw new ForbiddenException('You do not have permission to manage this company')
    }

    if (company.labelType !== 'COMPANY') {
      throw new ForbiddenException('Only companies can manage artists')
    }

    const artist = await this.prisma.recordLabel.findUnique({
      where: { id: artistLabelId },
      select: { parentLabelId: true },
    })

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${artistLabelId} not found`)
    }

    if (artist.parentLabelId !== companyId) {
      throw new ForbiddenException('Artist does not belong to this company')
    }

    await this.prisma.recordLabel.update({
      where: { id: artistLabelId },
      data: { parentLabelId: null },
    })

    return {
      message: 'Artist removed from company successfully',
      companyId,
      artistLabelId,
    }
  }
}
