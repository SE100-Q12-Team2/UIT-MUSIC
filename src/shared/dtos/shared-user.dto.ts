import { createZodDto } from 'nestjs-zod'
import { UpdateProfileResSchema } from 'src/routes/profile/profile.model'
import { GetUserProfileSchema } from 'src/shared/models/shared-user.model'

export class GetUserProfileResDTO extends createZodDto(GetUserProfileSchema) {}


export class UpdateProfileResDTO extends createZodDto(UpdateProfileResSchema) {}
