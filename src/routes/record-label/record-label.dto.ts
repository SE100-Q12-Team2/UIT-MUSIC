import { createZodDto } from 'nestjs-zod'
import {
  GetRecordLabelsQuerySchema,
  CreateRecordLabelSchema,
  UpdateRecordLabelSchema,
  RecordLabelSchema,
  PaginatedRecordLabelsSchema,
} from './record-label.model'

export class GetRecordLabelsQueryDto extends createZodDto(GetRecordLabelsQuerySchema) {}

export class CreateRecordLabelDto extends createZodDto(CreateRecordLabelSchema) {}
export class UpdateRecordLabelDto extends createZodDto(UpdateRecordLabelSchema) {}

export class RecordLabelResponseDto extends createZodDto(RecordLabelSchema) {}
export class PaginatedRecordLabelsResponseDto extends createZodDto(PaginatedRecordLabelsSchema) {}
