import { createZodDto } from "nestjs-zod";
import { CreatePermissionBodySchema, GetPermissionParamsSchema, GetPermissionQuerySchema, GetPermissionResSchema, PermissionSchema, UpdatePermissionBodySchema } from "src/routes/permission/permission.model";

export class PermissionTypeDTO extends createZodDto(PermissionSchema) {}

export class GetPermissionParamDTO extends createZodDto(GetPermissionParamsSchema) {}

export class GetPermissionQueryDTO extends createZodDto(GetPermissionQuerySchema) {}

export class GetPermissionResDTO extends createZodDto(GetPermissionResSchema) {}

export class CreatePermissionBodyDTO extends createZodDto(CreatePermissionBodySchema) {}

export class UpdatePermissionBodyDTO extends createZodDto(UpdatePermissionBodySchema) {}
