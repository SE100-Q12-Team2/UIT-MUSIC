import { Body, Controller, Delete, Post, Get, Param, Patch, Query, HttpCode, HttpStatus, Logger, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger'
import { GenreService } from './genre.service'
import { CreateGenreBodySchema, GetGenreQuerySchema, UpdateGenreBodySchema } from './genre.model'
import { ZodValidationPipe } from 'nestjs-zod'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@ApiTags('Genres')
@Controller('genres')
@Auth([AuthType.None])
export class GenreController {
  private readonly logger = new Logger(GenreController.name)

  constructor(private readonly service: GenreService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all genres',
    description: 'Retrieve a paginated list of music genres with optional filtering and search capabilities. This endpoint is public and does not require authentication.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search query for genre name' })
  @ApiOkResponse({ description: 'Genres retrieved successfully' })
  list(@Query(new ZodValidationPipe(GetGenreQuerySchema)) query) {
    try {
      this.logger.log(`Get genres with query: ${JSON.stringify(query)}`)
      const result = this.service.list(query)
      this.logger.log('Genres retrieved successfully')
      return result
    } catch (error) {
      this.logger.error('Failed to get genres', error.stack)
      throw error
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get genre by ID',
    description: 'Retrieve detailed information about a specific music genre including name, description, and associated metadata. This endpoint is public and does not require authentication.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Genre ID' })
  @ApiOkResponse({ description: 'Genre found successfully' })
  @ApiNotFoundResponse({ description: 'Genre not found' })
  get(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Get genre by ID: ${id}`)
      const result = this.service.get(id)
      this.logger.log(`Genre retrieved: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get genre ${id}`, error.stack)
      throw error
    }
  }

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new genre',
    description: 'Create a new music genre with name and description. Requires authentication with valid JWT token. Only authorized users can create genres.',
  })
  @ApiBody({ description: 'Genre creation data' })
  @ApiCreatedResponse({ description: 'Genre created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid genre data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  create(@Body(new ZodValidationPipe(CreateGenreBodySchema)) body) {
    try {
      this.logger.log(`Create genre: ${body.name}`)
      const result = this.service.create(body)
      this.logger.log('Genre created successfully')
      return result
    } catch (error) {
      this.logger.error('Failed to create genre', error.stack)
      throw error
    }
  }

  @Patch(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update genre',
    description: 'Update an existing music genre information including name and description. Requires authentication with valid JWT token. Only authorized users can update genres.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Genre ID to update' })
  @ApiBody({ description: 'Updated genre fields' })
  @ApiOkResponse({ description: 'Genre updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid genre data or validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Genre not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body(new ZodValidationPipe(UpdateGenreBodySchema)) body) {
    try {
      this.logger.log(`Update genre: ${id}`)
      const result = this.service.update(id, body)
      this.logger.log(`Genre updated successfully: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update genre ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete genre',
    description: 'Delete a music genre from the system. Requires authentication with valid JWT token. Only authorized users can delete genres. This may affect associated songs and playlists.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Genre ID to delete' })
  @ApiOkResponse({ description: 'Genre deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Genre not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Delete genre: ${id}`)
      const result = this.service.remove(id)
      this.logger.log(`Genre deleted successfully: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete genre ${id}`, error.stack)
      throw error
    }
  }
}
