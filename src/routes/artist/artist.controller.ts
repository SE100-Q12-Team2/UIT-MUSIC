import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
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

@ApiTags('Artists')
@Controller('artists')
@Auth([AuthType.Bearer])
export class ArtistController {
  constructor(private readonly service: ArtistService) {}

  @Get()
  @ZodSerializerDto(GetArtistsResponseDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all artists',
    description: 'Retrieve paginated list of artists with optional filtering and search capabilities',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search query for artist name' })
  @ApiQuery({
    name: 'hasPublicProfile',
    required: false,
    type: Boolean,
    description: 'Filter by public profile status',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['createdAt', 'updatedAt', 'artistName'],
    description: 'Sort field',
  })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiResponse({ status: 200, description: 'Artists retrieved successfully', type: GetArtistsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Query() query: GetArtistQueryDto) {
    return await this.service.list(query)
  }

  @Get(':id')
  @ZodSerializerDto(ArtistResponseDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get artist by ID',
    description: 'Retrieve detailed information about a specific artist',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Artist ID' })
  @ApiResponse({ status: 200, description: 'Artist found', type: ArtistResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Artist not found' })
  async get(@Param('id', ParseIntPipe) id: number) {
    return await this.service.get(id)
  }

  @Post()
  @ZodSerializerDto(CreateArtistResDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new artist',
    description: 'Create a new artist profile with name, biography, and profile image',
  })
  @ApiResponse({ status: 201, description: 'Artist created successfully', type: CreateArtistResDto })
  @ApiResponse({ status: 400, description: 'Invalid artist data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() body: CreateArtistBodyDto) {
    return await this.service.create(body)
  }

  @Patch(':id')
  @ZodSerializerDto(UpdateArtistResDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update artist',
    description: 'Update artist profile information',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Artist ID' })
  @ApiResponse({ status: 200, description: 'Artist updated successfully', type: UpdateArtistResDto })
  @ApiResponse({ status: 400, description: 'Invalid artist data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Artist not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateArtistBodyDto) {
    return await this.service.update(id, body)
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete artist',
    description: 'Delete an artist profile from the platform',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Artist ID' })
  @ApiResponse({ status: 200, description: 'Artist deleted successfully', type: MessageResDTO })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Artist not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.service.remove(id)
  }
}
