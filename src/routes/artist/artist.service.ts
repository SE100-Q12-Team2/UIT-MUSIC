import { Injectable } from '@nestjs/common'
import { CreateArtistBodyType, GetArtistQueryType, UpdateArtistBodyType } from './artist.model'
import { ArtistRepository } from 'src/routes/artist/artist.repo'

@Injectable()
export class ArtistService {
  constructor(private readonly repo: ArtistRepository) {}

  list(query: GetArtistQueryType) {
    return this.repo.findAll(query)
  }

  get(id: number) {
    return this.repo.findById(id)
  }

  create(body: CreateArtistBodyType) {
    return this.repo.create(body)
  }

  update(id: number, body: UpdateArtistBodyType) {
    return this.repo.update(id, body)
  }

  remove(id: number) {
    return this.repo.delete(id)
  }
}
