import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateArtistBodyDto,
  CreateArtistResDto,
  GetArtistQueryDto,
  GetArtistsResponseDto,
  UpdateArtistBodyDto,
  UpdateArtistResDto,
  ArtistResponseDto,
} from './artist.dto'
import { ArtistService } from './artist.service'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('artists')
@Auth([AuthType.Bearer])
export class ArtistController {
  constructor(private readonly service: ArtistService) {}

  @Get()
  @ZodSerializerDto(GetArtistsResponseDto)
  async list(@Query() query: GetArtistQueryDto) {
    return await this.service.list(query)
  }

  @Get(':id')
  @ZodSerializerDto(ArtistResponseDto)
  async get(@Param('id', ParseIntPipe) id: number) {
    return await this.service.get(id)
  }

  @Post()
  @ZodSerializerDto(CreateArtistResDto)
  async create(@Body() body: CreateArtistBodyDto) {
    return await this.service.create(body)
  }

  @Patch(':id')
  @ZodSerializerDto(UpdateArtistResDto)
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateArtistBodyDto) {
    return await this.service.update(id, body)
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.service.remove(id)
  }
}
