import { createZodDto } from 'nestjs-zod'
import {
  AddFollowBodySchema,
  AddFollowResSchema,
  CheckFollowQuerySchema,
  CheckFollowResSchema,
  GetFollowersCountResSchema,
  GetFollowsQuerySchema,
  GetFollowsResponseSchema,
} from 'src/routes/follow/follow.model'

export class GetFollowsQueryDTO extends createZodDto(GetFollowsQuerySchema) {}
export class GetFollowsResponseDTO extends createZodDto(GetFollowsResponseSchema) {}

export class AddFollowBodyDTO extends createZodDto(AddFollowBodySchema) {}
export class AddFollowResDTO extends createZodDto(AddFollowResSchema) {}

export class CheckFollowQueryDTO extends createZodDto(CheckFollowQuerySchema) {}
export class CheckFollowResDTO extends createZodDto(CheckFollowResSchema) {}

export class GetFollowersCountResDTO extends createZodDto(GetFollowersCountResSchema) {}
