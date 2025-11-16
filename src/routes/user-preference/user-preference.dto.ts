import { createZodDto } from 'nestjs-zod'
import {
  CreateUserPreferenceSchema,
  UpdateUserPreferenceSchema,
  UserPreferenceResponseSchema,
} from './user-preference.model'

export class CreateUserPreferenceDto extends createZodDto(CreateUserPreferenceSchema) {}

export class UpdateUserPreferenceDto extends createZodDto(UpdateUserPreferenceSchema) {}

export class UserPreferenceResponseDto extends createZodDto(UserPreferenceResponseSchema) {}
