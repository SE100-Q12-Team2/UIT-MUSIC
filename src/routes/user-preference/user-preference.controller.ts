import { Controller, Get, Post, Put, Delete, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'
import { UserPreferenceService } from './user-preference.service'
import { CreateUserPreferenceDto, UpdateUserPreferenceDto, UserPreferenceResponseDto } from './user-preference.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('User Preferences')
@Controller('user-preferences')
@Auth([AuthType.Bearer])
export class UserPreferenceController {
  private readonly logger = new Logger(UserPreferenceController.name)

  constructor(private readonly userPreferenceService: UserPreferenceService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UserPreferenceResponseDto)
  @ApiOperation({
    summary: 'Get user preferences',
    description: 'Retrieve user preferences including audio quality settings, playback preferences, and notification settings for the authenticated user.',
  })
  @ApiOkResponse({ description: 'User preferences retrieved successfully', type: UserPreferenceResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'User preferences not found' })
  async getUserPreference(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Get preferences for user ${userId}`)
      const result = await this.userPreferenceService.getUserPreference(userId)
      this.logger.log(`Preferences retrieved for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get preferences for user ${userId}`, error.stack)
      throw error
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UserPreferenceResponseDto)
  @ApiOperation({
    summary: 'Create user preferences',
    description: 'Create initial user preferences with default or custom settings for audio quality, playback, and notifications. Requires authentication.',
  })
  @ApiBody({ type: CreateUserPreferenceDto, description: 'User preference settings' })
  @ApiCreatedResponse({ description: 'User preferences created successfully', type: UserPreferenceResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid preference data or preferences already exist' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async createUserPreference(@ActiveUser('userId') userId: number, @Body() body: CreateUserPreferenceDto) {
    try {
      this.logger.log(`Create preferences for user ${userId}`)
      const result = await this.userPreferenceService.createUserPreference(userId, body)
      this.logger.log(`Preferences created for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to create preferences for user ${userId}`, error.stack)
      throw error
    }
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UserPreferenceResponseDto)
  @ApiOperation({
    summary: 'Update user preferences',
    description: 'Update existing user preferences including audio quality, playback settings, and notification preferences. Requires authentication.',
  })
  @ApiBody({ type: UpdateUserPreferenceDto, description: 'Updated preference fields' })
  @ApiOkResponse({ description: 'User preferences updated successfully', type: UserPreferenceResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid preference data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'User preferences not found' })
  async updateUserPreference(@ActiveUser('userId') userId: number, @Body() body: UpdateUserPreferenceDto) {
    try {
      this.logger.log(`Update preferences for user ${userId}`)
      const result = await this.userPreferenceService.updateUserPreference(userId, body)
      this.logger.log(`Preferences updated for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update preferences for user ${userId}`, error.stack)
      throw error
    }
  }

  @Put('upsert')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UserPreferenceResponseDto)
  @ApiOperation({
    summary: 'Upsert user preferences',
    description: 'Create or update user preferences in a single operation. Creates new preferences if they don\'t exist, otherwise updates existing ones.',
  })
  @ApiBody({ type: CreateUserPreferenceDto, description: 'User preference settings' })
  @ApiOkResponse({ description: 'User preferences upserted successfully', type: UserPreferenceResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid preference data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async upsertUserPreference(@ActiveUser('userId') userId: number, @Body() body: CreateUserPreferenceDto) {
    try {
      this.logger.log(`Upsert preferences for user ${userId}`)
      const result = await this.userPreferenceService.upsertUserPreference(userId, body)
      this.logger.log(`Preferences upserted for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to upsert preferences for user ${userId}`, error.stack)
      throw error
    }
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Delete user preferences',
    description: 'Delete all user preferences and reset to default settings. This action is permanent and requires authentication.',
  })
  @ApiOkResponse({ description: 'User preferences deleted successfully', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'User preferences not found' })
  async deleteUserPreference(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Delete preferences for user ${userId}`)
      const result = await this.userPreferenceService.deleteUserPreference(userId)
      this.logger.log(`Preferences deleted for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete preferences for user ${userId}`, error.stack)
      throw error
    }
  }
}
