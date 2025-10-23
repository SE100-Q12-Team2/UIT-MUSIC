import { Injectable } from '@nestjs/common';
import { GenreRepository } from './genre.repo';
import { CreateGenreBodyType, UpdateGenreBodyType } from './genre.model';

@Injectable()
export class GenreService {
    constructor(private readonly genreRepo: GenreRepository) {}

    list (query) {
        return this.genreRepo.findAll(query);
    }
    
    get (id: number) {
        return this.genreRepo.findById(id);
    }

    create (body: CreateGenreBodyType){
        return this.genreRepo.create(body);
    }

    update (id:number, body: UpdateGenreBodyType){
        return this.genreRepo.update(id, body);
    }
    remove (id:number){
        return this.genreRepo.delete(id);
    }
}
