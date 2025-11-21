import { Controller, Get, Body, Patch } from '@nestjs/common'
import { ProfileService } from './profile.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import { ChangePasswordBodyDTO, UpdateProfileBodyDTO } from 'src/routes/profile/profile.dto'
import { GetUserProfileResDTO, UpdateProfileResDTO } from 'src/shared/dtos/shared-user.dto'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@Controller('profile')
@Auth([AuthType.Bearer])
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ZodSerializerDto(GetUserProfileResDTO)
  getProfile(@ActiveUser('userId') userId: number) {
    return this.profileService.getProfile(userId)
  }

  @Patch()
  @ZodSerializerDto(UpdateProfileResDTO)
  updateProfile(@Body() body: UpdateProfileBodyDTO, @ActiveUser('userId') userId: number) {
    return this.profileService.updateProfile({ userId, body })
  }

  @Patch('change-password')
  @ZodSerializerDto(MessageResDTO)
  changePassword(@ActiveUser('userId') userId: number, @Body() data: ChangePasswordBodyDTO) {
    return this.profileService.changePassword({ userId, data })
  }
}
