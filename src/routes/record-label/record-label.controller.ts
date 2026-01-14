import { Controller, Get, Post, Put, Delete, Query, Param, Body, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiQuery } from '@nestjs/swagger'
import {
  GetRecordLabelsQueryDto,
  CreateRecordLabelDto,
  UpdateRecordLabelDto,
  RecordLabelResponseDto,
  PaginatedRecordLabelsResponseDto,
  GetManagedArtistsQueryDto,
  AddArtistToCompanyDto,
} from './record-label.dto'
import { RecordLabelService } from './record-label.service'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { AccessTokenPayloadReturn } from 'src/shared/types/jwt.type'

@ApiTags('Record Labels')
@Controller('record-labels')
export class RecordLabelController {
  private readonly logger = new Logger(RecordLabelController.name)

  constructor(private readonly recordLabelService: RecordLabelService) {}

  @Auth([AuthType.None])
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all record labels', description: 'Retrieve paginated list of record labels. Public access.' })
  @ApiOkResponse({ description: 'Record labels retrieved', type: PaginatedRecordLabelsResponseDto })
  async getRecordLabels(@Query() query: GetRecordLabelsQueryDto): Promise<PaginatedRecordLabelsResponseDto> {
    try {
      this.logger.log('Get all record labels')
      return await this.recordLabelService.getRecordLabels(query)
    } catch (error) {
      this.logger.error('Failed to get record labels', error.stack)
      throw error
    }
  }

  @Auth([AuthType.None])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get record label by ID', description: 'Retrieve specific record label details. Public access.' })
  @ApiParam({ name: 'id', type: Number, description: 'Record label ID' })
  @ApiOkResponse({ description: 'Record label found', type: RecordLabelResponseDto })
  @ApiNotFoundResponse({ description: 'Record label not found' })
  async getRecordLabelById(@Param('id', ParseIntPipe) id: number): Promise<RecordLabelResponseDto> {
    try {
      this.logger.log(`Get record label ${id}`)
      return await this.recordLabelService.getRecordLabelById(id)
    } catch (error) {
      this.logger.error(`Failed to get record label ${id}`, error.stack)
      throw error
    }
  }

  @Auth([AuthType.None])
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get record label by user', description: 'Get record label owned by specific user. Public access.' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'Record label found', type: RecordLabelResponseDto })
  @ApiNotFoundResponse({ description: 'Record label not found' })
  async getRecordLabelByUserId(@Param('userId', ParseIntPipe) userId: number): Promise<RecordLabelResponseDto> {
    try {
      this.logger.log(`Get record label by user ${userId}`)
      return await this.recordLabelService.getRecordLabelByUserId(userId)
    } catch (error) {
      this.logger.error(`Failed to get record label for user ${userId}`, error.stack)
      throw error
    }
  }

  @Auth([AuthType.Bearer])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create record label', description: 'Create a new record label. Requires authentication.' })
  @ApiBody({ type: CreateRecordLabelDto, description: 'Record label creation data' })
  @ApiCreatedResponse({ description: 'Record label created', type: RecordLabelResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createRecordLabel(
    @Body() body: CreateRecordLabelDto,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ): Promise<RecordLabelResponseDto> {
    try {
      this.logger.log(`Create record label by user ${user.userId}`)
      const result = await this.recordLabelService.createRecordLabel(user.userId, body)
      this.logger.log(`Record label created: ${result.id}`)
      return result
    } catch (error) {
      this.logger.error('Failed to create record label', error.stack)
      throw error
    }
  }

  @Auth([AuthType.Bearer])
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update record label', description: 'Update record label details. Requires authentication and ownership.' })
  @ApiParam({ name: 'id', type: Number, description: 'Record label ID' })
  @ApiBody({ type: UpdateRecordLabelDto, description: 'Updated fields' })
  @ApiOkResponse({ description: 'Record label updated', type: RecordLabelResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Record label not found' })
  async updateRecordLabel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRecordLabelDto,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ): Promise<RecordLabelResponseDto> {
    try {
      this.logger.log(`Update record label ${id} by user ${user.userId}`)
      const result = await this.recordLabelService.updateRecordLabel(id, user.userId, body)
      this.logger.log(`Record label ${id} updated`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update record label ${id}`, error.stack)
      throw error
    }
  }

  @Auth([AuthType.Bearer])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete record label', description: 'Delete a record label. Requires authentication and ownership.' })
  @ApiParam({ name: 'id', type: Number, description: 'Record label ID' })
  @ApiOkResponse({ description: 'Record label deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Record label not found' })
  async deleteRecordLabel(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: AccessTokenPayloadReturn) {
    try {
      this.logger.log(`Delete record label ${id} by user ${user.userId}`)
      const result = await this.recordLabelService.deleteRecordLabel(id, user.userId)
      this.logger.log(`Record label ${id} deleted`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete record label ${id}`, error.stack)
      throw error
    }
  }

  @Auth([AuthType.Bearer])
  @Get(':id/managed-artists')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get managed artists', 
    description: 'Get all artists managed by a company label. Only available for company labels.' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Company label ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by artist name' })
  @ApiOkResponse({ description: 'Managed artists retrieved', type: PaginatedRecordLabelsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Company label not found' })
  async getManagedArtists(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetManagedArtistsQueryDto,
  ): Promise<PaginatedRecordLabelsResponseDto> {
    try {
      this.logger.log(`Get managed artists for company ${id}`)
      return await this.recordLabelService.getManagedArtists(id, query)
    } catch (error) {
      this.logger.error(`Failed to get managed artists for company ${id}`, error.stack)
      throw error
    }
  }

  @Auth([AuthType.Bearer])
  @Post(':id/managed-artists')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Add artist to company', 
    description: 'Add an individual artist to be managed by a company. Requires company ownership.' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Company label ID' })
  @ApiBody({ type: AddArtistToCompanyDto, description: 'Artist label ID to add' })
  @ApiCreatedResponse({ description: 'Artist added to company' })
  @ApiBadRequestResponse({ description: 'Invalid data or artist already managed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Company or artist not found' })
  async addArtistToCompany(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AddArtistToCompanyDto,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ) {
    try {
      this.logger.log(`Add artist ${body.artistLabelId} to company ${id} by user ${user.userId}`)
      const result = await this.recordLabelService.addArtistToCompany(id, body.artistLabelId, user.userId)
      this.logger.log(`Artist ${body.artistLabelId} added to company ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to add artist to company ${id}`, error.stack)
      throw error
    }
  }

  @Auth([AuthType.Bearer])
  @Delete(':id/managed-artists/:artistId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Remove artist from company', 
    description: 'Remove an artist from company management. Requires company ownership.' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Company label ID' })
  @ApiParam({ name: 'artistId', type: Number, description: 'Artist label ID to remove' })
  @ApiOkResponse({ description: 'Artist removed from company' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Company or artist not found' })
  async removeArtistFromCompany(
    @Param('id', ParseIntPipe) id: number,
    @Param('artistId', ParseIntPipe) artistId: number,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ) {
    try {
      this.logger.log(`Remove artist ${artistId} from company ${id} by user ${user.userId}`)
      const result = await this.recordLabelService.removeArtistFromCompany(id, artistId, user.userId)
      this.logger.log(`Artist ${artistId} removed from company ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to remove artist from company ${id}`, error.stack)
      throw error
    }
  }
}
