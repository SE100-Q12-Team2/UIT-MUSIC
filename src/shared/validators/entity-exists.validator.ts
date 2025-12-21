import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'

export enum EntityType {
  ALBUM = 'album',
  GENRE = 'genre',
  SONG = 'song',
  USER = 'user',
  RECORD_LABEL = 'recordLabel',
  PLAYLIST = 'playlist',
}

@Injectable()
export class EntityExistsValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateSingleId(id: number, entityType: EntityType, fieldName?: string): Promise<void> {
    const exists = await this.checkExists(id, entityType)
    if (!exists) {
      const field = fieldName || `${entityType}Id`
      throw new BadRequestException(`${this.getEntityDisplayName(entityType)} with ID ${id} does not exist`, {
        cause: { field, value: id },
      })
    }
  }

  async validateMultipleIds(ids: number[], entityType: EntityType, fieldName?: string): Promise<void> {
    const missingIds = await this.findMissingIds(ids, entityType)
    if (missingIds.length > 0) {
      const field = fieldName || `${entityType}Ids`
      throw new BadRequestException(`The following ${entityType} IDs do not exist: ${missingIds.join(', ')}`, {
        cause: { field, value: missingIds },
      })
    }
  }

  async validateOptionalId(id: number | undefined | null, entityType: EntityType, fieldName?: string): Promise<void> {
    if (id !== undefined && id !== null) {
      await this.validateSingleId(id, entityType, fieldName)
    }
  }

  async checkExists(id: number, entityType: EntityType): Promise<boolean> {
    try {
      const entity = await (this.prisma[entityType] as any).findUnique({
        where: { id },
        select: { id: true },
      })
      return !!entity
    } catch {
      return false
    }
  }

  async findMissingIds(ids: number[], entityType: EntityType): Promise<number[]> {
    if (ids.length === 0) return []

    try {
      const entities = await (this.prisma[entityType] as any).findMany({
        where: { id: { in: ids } },
        select: { id: true },
      })
      const foundIds = entities.map((e: any) => Number(e.id))
      return ids.filter((id) => !foundIds.includes(id))
    } catch {
      return ids
    }
  }

  private getEntityDisplayName(entityType: EntityType): string {
    const displayNames: Record<EntityType, string> = {
      [EntityType.ALBUM]: 'Album',
      [EntityType.GENRE]: 'Genre',
      [EntityType.SONG]: 'Song',
      [EntityType.USER]: 'User',
      [EntityType.RECORD_LABEL]: 'Record Label',
      [EntityType.PLAYLIST]: 'Playlist',
    }
    return displayNames[entityType] || entityType
  }
}
