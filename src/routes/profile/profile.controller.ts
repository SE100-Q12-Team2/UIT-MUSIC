import { Controller, Get, Body, Patch, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { 
  ApiTags, 
  ApiOperation, 
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { ProfileService } from './profile.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import { ChangePasswordBodyDTO, UpdateProfileBodyDTO } from 'src/routes/profile/profile.dto'
import { GetUserProfileResDTO, UpdateProfileResDTO } from 'src/shared/dtos/shared-user.dto'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('Profile')
@ApiBearerAuth('JWT-auth')
@Controller('profile')
@Auth([AuthType.Bearer])
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name)

  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetUserProfileResDTO)
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve the authenticated user profile information including personal details and preferences.',
  })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    type: GetUserProfileResDTO,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  getProfile(@ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Getting profile for user ID: ${userId}`)
      return this.profileService.getProfile(userId)
    } catch (error) {
      this.logger.error(`Failed to get profile for user ID: ${userId}`, error.stack)
      throw error
    }
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UpdateProfileResDTO)
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update authenticated user profile information such as full name, date of birth, gender, and profile image.',
  })
  @ApiBody({
    type: UpdateProfileBodyDTO,
    description: 'Profile fields to update (all fields are optional)',
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: UpdateProfileResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or validation failed',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  updateProfile(@Body() body: UpdateProfileBodyDTO, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Updating profile for user ID: ${userId}`)
      const result = this.profileService.updateProfile({ userId, body })
      this.logger.log(`Profile updated successfully for user ID: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update profile for user ID: ${userId}`, error.stack)
      throw error
    }
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the authenticated user password. Requires current password and new password confirmation.',
  })
  @ApiBody({
    type: ChangePasswordBodyDTO,
    description: 'Current password, new password, and confirmation',
  })
  @ApiOkResponse({
    description: 'Password changed successfully. All sessions will be invalidated.',
    type: MessageResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid current password, password mismatch, or validation failed',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  changePassword(@ActiveUser('userId') userId: number, @Body() data: ChangePasswordBodyDTO) {
    try {
      this.logger.log(`Password change attempt for user ID: ${userId}`)
      const result = this.profileService.changePassword({ userId, data })
      this.logger.log(`Password changed successfully for user ID: ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to change password for user ID: ${userId}`, error.stack)
      throw error
    }
  }
}
