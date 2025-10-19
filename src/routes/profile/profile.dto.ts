import { createZodDto } from "nestjs-zod";
import { ChangePasswordBodySchema, UpdateProfileBodySchema } from "src/routes/profile/profile.model";

export class UpdateProfileBodyDTO extends createZodDto(UpdateProfileBodySchema) {}


export class ChangePasswordBodyDTO extends createZodDto(ChangePasswordBodySchema) {}