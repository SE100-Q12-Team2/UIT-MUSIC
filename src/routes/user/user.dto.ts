import { createZodDto } from 'nestjs-zod'
import {
  CreateUserBodySchema,
  GetUsersQuerySchema,
  PaginatedUsersResponseSchema,
  UpdateUserRoleSchema,
  UpdateUserSchema,
  UpdateUserStatusSchema,
  UserDetailResponseSchema,
  UserResponseSchema,
  UserStatisticsResponseSchema,
} from './user.model'

export class CreateUserDto extends createZodDto(CreateUserBodySchema) {}

export class GetUsersQueryDto extends createZodDto(GetUsersQuerySchema) {}

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

export class UpdateUserStatusDto extends createZodDto(UpdateUserStatusSchema) {}

export class UpdateUserRoleDto extends createZodDto(UpdateUserRoleSchema) {}

export class PaginatedUsersResponseDto extends createZodDto(PaginatedUsersResponseSchema) {}

export class UserResponseDto extends createZodDto(UserResponseSchema) {}

export class UserDetailResponseDto extends createZodDto(UserDetailResponseSchema) {}

export class UserStatisticsResponseDto extends createZodDto(UserStatisticsResponseSchema) {}
