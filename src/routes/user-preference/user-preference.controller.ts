import { Controller, Get, Post, Put, Delete, Body } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { UserPreferenceService } from './user-preference.service'
import { CreateUserPreferenceDto, UpdateUserPreferenceDto, UserPreferenceResponseDto } from './user-preference.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('user-preferences')
export class UserPreferenceController {
  constructor(private readonly userPreferenceService: UserPreferenceService) {}

  @Get()
  @ZodSerializerDto(UserPreferenceResponseDto)
  async getUserPreference(@ActiveUser('userId') userId: number) {
    return await this.userPreferenceService.getUserPreference(userId)
  }

  @Post()
  @ZodSerializerDto(UserPreferenceResponseDto)
  async createUserPreference(@ActiveUser('userId') userId: number, @Body() body: CreateUserPreferenceDto) {
    return await this.userPreferenceService.createUserPreference(userId, body)
  }

  @Put()
  @ZodSerializerDto(UserPreferenceResponseDto)
  async updateUserPreference(@ActiveUser('userId') userId: number, @Body() body: UpdateUserPreferenceDto) {
    return await this.userPreferenceService.updateUserPreference(userId, body)
  }

  @Put('upsert')
  @ZodSerializerDto(UserPreferenceResponseDto)
  async upsertUserPreference(@ActiveUser('userId') userId: number, @Body() body: CreateUserPreferenceDto) {
    return await this.userPreferenceService.upsertUserPreference(userId, body)
  }

  @Delete()
  @ZodSerializerDto(MessageResDTO)
  async deleteUserPreference(@ActiveUser('userId') userId: number) {
    return await this.userPreferenceService.deleteUserPreference(userId)
  }
}
