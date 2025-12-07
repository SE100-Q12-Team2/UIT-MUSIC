import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiBody } from '@nestjs/swagger'
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
  private readonly logger = new Logger(ArtistController.name)

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
  @ApiOkResponse({ description: 'Artists retrieved successfully', type: GetArtistsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async list(@Query() query: GetArtistQueryDto) {
    try {
      this.logger.log(`Get artists with query: ${JSON.stringify(query)}`)
      const result = await this.service.list(query)
      this.logger.log(`Retrieved ${result.data.length} artists`)
      return result
    } catch (error) {
      this.logger.error('Failed to get artists', error.stack)
      throw error
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(ArtistResponseDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get artist by ID',
    description: 'Retrieve detailed information about a specific artist including name, biography, profile image, and statistics. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Artist ID' })
  @ApiOkResponse({ description: 'Artist found', type: ArtistResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Artist not found' })
  async get(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Get artist by ID: ${id}`)
      const result = await this.service.get(id)
      this.logger.log(`Artist retrieved: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get artist ${id}`, error.stack)
      throw error
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CreateArtistResDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new artist',
    description: 'Create a new artist profile with name, biography, profile image, and public profile settings. Requires authentication.',
  })
  @ApiBody({ type: CreateArtistBodyDto, description: 'Artist creation data' })
  @ApiCreatedResponse({ description: 'Artist created successfully', type: CreateArtistResDto })
  @ApiBadRequestResponse({ description: 'Invalid artist data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async create(@Body() body: CreateArtistBodyDto) {
    try {
      this.logger.log(`Create artist: ${body.artistName}`)
      const result = await this.service.create(body)
      this.logger.log(`Artist created successfully: ${result.id}`)
      return result
    } catch (error) {
      this.logger.error('Failed to create artist', error.stack)
      throw error
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UpdateArtistResDto)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update artist',
    description: 'Update artist profile information including name, biography, profile image, and public profile status. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Artist ID to update' })
  @ApiBody({ type: UpdateArtistBodyDto, description: 'Updated artist fields' })
  @ApiOkResponse({ description: 'Artist updated successfully', type: UpdateArtistResDto })
  @ApiBadRequestResponse({ description: 'Invalid artist data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Artist not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateArtistBodyDto) {
    try {
      this.logger.log(`Update artist: ${id}`)
      const result = await this.service.update(id, body)
      this.logger.log(`Artist updated successfully: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update artist ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete artist',
    description: 'Soft delete an artist profile from the platform. Artist will be marked as deleted. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Artist ID to delete' })
  @ApiOkResponse({ description: 'Artist deleted successfully', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Artist not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Delete artist: ${id}`)
      const result = await this.service.remove(id)
      this.logger.log(`Artist deleted successfully: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete artist ${id}`, error.stack)
      throw error
    }
  }
}
