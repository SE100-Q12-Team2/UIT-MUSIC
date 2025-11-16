import { Injectable, Logger } from '@nestjs/common'
import { UserPreferenceRepository } from './user-preference.repo'
import { CreateUserPreferenceType, UpdateUserPreferenceType, UserPreferenceResponseType } from './user-preference.model'
import { UserPreferenceNotFoundException, InvalidGenreException } from './user-preference.error'

@Injectable()
export class UserPreferenceService {
  private readonly logger = new Logger(UserPreferenceService.name)

  constructor(private readonly userPreferenceRepository: UserPreferenceRepository) {}

  async getUserPreference(userId: number): Promise<UserPreferenceResponseType> {
    const preference = await this.userPreferenceRepository.findByUserId(userId)

    if (!preference) {
      throw UserPreferenceNotFoundException
    }

    return this.transformPreference(preference)
  }

  async createUserPreference(userId: number, data: CreateUserPreferenceType): Promise<UserPreferenceResponseType> {
    const existing = await this.userPreferenceRepository.findByUserId(userId)

    if (existing) {
      this.logger.warn(`User preference already exists for user ${userId}, using upsert instead`)
      return this.upsertUserPreference(userId, data)
    }

    if (data.preferredGenres && data.preferredGenres.length > 0) {
      const isValid = await this.userPreferenceRepository.validateGenres(data.preferredGenres)
      if (!isValid) {
        throw InvalidGenreException
      }
    }

    const preference = await this.userPreferenceRepository.create(userId, data)

    this.logger.log(`Created user preference for user ${userId}`)

    return this.transformPreference(preference)
  }

  async updateUserPreference(userId: number, data: UpdateUserPreferenceType): Promise<UserPreferenceResponseType> {
    const existing = await this.userPreferenceRepository.findByUserId(userId)

    if (!existing) {
      throw UserPreferenceNotFoundException
    }

    if (data.preferredGenres && data.preferredGenres.length > 0) {
      const isValid = await this.userPreferenceRepository.validateGenres(data.preferredGenres)
      if (!isValid) {
        throw InvalidGenreException
      }
    }

    const preference = await this.userPreferenceRepository.update(userId, data)

    this.logger.log(`Updated user preference for user ${userId}`)

    return this.transformPreference(preference)
  }

  async upsertUserPreference(
    userId: number,
    data: CreateUserPreferenceType | UpdateUserPreferenceType,
  ): Promise<UserPreferenceResponseType> {
    if (data.preferredGenres && data.preferredGenres.length > 0) {
      const isValid = await this.userPreferenceRepository.validateGenres(data.preferredGenres)
      if (!isValid) {
        throw InvalidGenreException
      }
    }

    const preference = await this.userPreferenceRepository.upsert(userId, data)

    this.logger.log(`Upserted user preference for user ${userId}`)

    return this.transformPreference(preference)
  }

  async deleteUserPreference(userId: number) {
    const existing = await this.userPreferenceRepository.findByUserId(userId)

    if (!existing) {
      throw UserPreferenceNotFoundException
    }

    await this.userPreferenceRepository.delete(userId)

    this.logger.log(`Deleted user preference for user ${userId}`)

    return {
      success: true,
      message: 'User preference deleted successfully',
    }
  }

  private transformPreference(preference: any): UserPreferenceResponseType {
    return {
      userId: preference.userId,
      preferredGenres: preference.preferredGenres as number[] | null,
      preferredLanguages: preference.preferredLanguages as ('Vietnamese' | 'English')[] | null,
      explicitContent: preference.explicitContent,
      autoPlay: preference.autoPlay,
      highQualityStreaming: preference.highQualityStreaming,
      updatedAt: preference.updatedAt,
    }
  }
}
