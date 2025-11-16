import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/shared/services'
import { CreateUserPreferenceType, UpdateUserPreferenceType } from './user-preference.model'

@Injectable()
export class UserPreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number) {
    return this.prisma.userPreference.findUnique({
      where: { userId },
    })
  }

  async create(userId: number, data: CreateUserPreferenceType) {
    return this.prisma.userPreference.create({
      data: {
        userId,
        preferredGenres: data.preferredGenres ? (data.preferredGenres as any) : Prisma.JsonNull,
        preferredLanguages: data.preferredLanguages ? (data.preferredLanguages as any) : Prisma.JsonNull,
        explicitContent: data.explicitContent ?? false,
        autoPlay: data.autoPlay ?? true,
        highQualityStreaming: data.highQualityStreaming ?? false,
      },
    })
  }

  async update(userId: number, data: UpdateUserPreferenceType) {
    const updateData: any = {}

    if (data.preferredGenres !== undefined) {
      updateData.preferredGenres = data.preferredGenres
    }
    if (data.preferredLanguages !== undefined) {
      updateData.preferredLanguages = data.preferredLanguages
    }
    if (data.explicitContent !== undefined) {
      updateData.explicitContent = data.explicitContent
    }
    if (data.autoPlay !== undefined) {
      updateData.autoPlay = data.autoPlay
    }
    if (data.highQualityStreaming !== undefined) {
      updateData.highQualityStreaming = data.highQualityStreaming
    }

    return this.prisma.userPreference.update({
      where: { userId },
      data: updateData,
    })
  }

  async upsert(userId: number, data: CreateUserPreferenceType | UpdateUserPreferenceType) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        preferredGenres: data.preferredGenres ? (data.preferredGenres as any) : Prisma.JsonNull,
        preferredLanguages: data.preferredLanguages ? (data.preferredLanguages as any) : Prisma.JsonNull,
        explicitContent: data.explicitContent ?? false,
        autoPlay: data.autoPlay ?? true,
        highQualityStreaming: data.highQualityStreaming ?? false,
      },
      update: {
        ...(data.preferredGenres !== undefined && { preferredGenres: data.preferredGenres as any }),
        ...(data.preferredLanguages !== undefined && { preferredLanguages: data.preferredLanguages as any }),
        ...(data.explicitContent !== undefined && { explicitContent: data.explicitContent }),
        ...(data.autoPlay !== undefined && { autoPlay: data.autoPlay }),
        ...(data.highQualityStreaming !== undefined && { highQualityStreaming: data.highQualityStreaming }),
      },
    })
  }

  async delete(userId: number) {
    return this.prisma.userPreference.delete({
      where: { userId },
    })
  }

  async validateGenres(genreIds: number[]): Promise<boolean> {
    const count = await this.prisma.genre.count({
      where: {
        id: { in: genreIds },
        isActive: true,
      },
    })
    return count === genreIds.length
  }
}
