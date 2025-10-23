import { Body, Controller, Delete, Post, Get, Param, Patch, Query } from '@nestjs/common';
import { GenreService } from './genre.service';
import { CreateGenreBodySchema, GetGenreQuerySchema, UpdateGenreBodySchema } from './genre.model';
import { ZodValidationPipe } from 'nestjs-zod';

@Controller('genres')
export class GenreController {
    constructor(private readonly service: GenreService) { }
    @Get()
    list(@Query(new ZodValidationPipe(GetGenreQuerySchema)) query) {
        return this.service.list(query)
    }

    @Get(':id')
    get(@Param('id') id: string) {
        return this.service.get(Number(id))
    }

    @Post()
    create(@Body(new ZodValidationPipe(CreateGenreBodySchema)) body) {
        return this.service.create(body)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateGenreBodySchema)) body) {
        return this.service.update(Number(id), body)
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(Number(id))
    }
}
