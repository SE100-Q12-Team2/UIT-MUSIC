import { createZodDto } from 'nestjs-zod'
import {
  CreateContactFormSchema,
  UpdateContactFormStatusSchema,
  ContactFormResponseSchema,
} from './contact.model'

export class CreateContactFormDto extends createZodDto(CreateContactFormSchema) {}
export class UpdateContactFormStatusDto extends createZodDto(UpdateContactFormStatusSchema) {}
export class ContactFormResponseDto extends createZodDto(ContactFormResponseSchema) {}
