import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ZodValidationPipe } from 'nestjs-zod'
import { CreateArtistBodySchema, GetArtistQuerySchema, UpdateArtistBodySchema } from './artist.model'
import { ArtistService } from './artist.service'

@Controller('artists')
export class ArtistController {
  constructor(private readonly service: ArtistService) {}

  @Get()
  list(@Query(new ZodValidationPipe(GetArtistQuerySchema)) query) {
    return this.service.list(query)
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(Number(id))
  }

  @Post()
  create(@Body(new ZodValidationPipe(CreateArtistBodySchema)) body) {
    return this.service.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateArtistBodySchema)) body) {
    return this.service.update(Number(id), body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
