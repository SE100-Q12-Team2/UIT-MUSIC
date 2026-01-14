import { Injectable } from '@nestjs/common'
import { CreateRecordLabelType, GetRecordLabelsQueryType, UpdateRecordLabelType } from './record-label.model'
import { RecordLabelRepository } from './record-label.repo'

@Injectable()
export class RecordLabelService {
  constructor(private readonly recordRepository: RecordLabelRepository) {}

  getRecordLabels(query: GetRecordLabelsQueryType) {
    return this.recordRepository.findAll(query)
  }

  getRecordLabelById(id: number) {
    return this.recordRepository.findById(id)
  }

  getRecordLabelByUserId(userId: number) {
    return this.recordRepository.findByUserId(userId)
  }

  createRecordLabel(userId: number, body: CreateRecordLabelType) {
    return this.recordRepository.create(userId, body)
  }

  updateRecordLabel(id: number, userId: number, body: UpdateRecordLabelType) {
    return this.recordRepository.update(id, userId, body)
  }

  deleteRecordLabel(id: number, userId: number) {
    return this.recordRepository.delete(id, userId)
  }

  getManagedArtists(companyId: number, query: { page: number; limit: number; search?: string }) {
    return this.recordRepository.getManagedArtists(companyId, query)
  }

  addArtistToCompany(companyId: number, artistLabelId: number, userId: number) {
    return this.recordRepository.addArtistToCompany(companyId, artistLabelId, userId)
  }

  removeArtistFromCompany(companyId: number, artistLabelId: number, userId: number) {
    return this.recordRepository.removeArtistFromCompany(companyId, artistLabelId, userId)
  }
}
