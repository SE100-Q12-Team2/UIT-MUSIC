import { Body, Controller, Delete, Get, Param, Post, Put, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger'
import {
  CreatePermissionBodyDTO,
  GetPermissionParamDTO,
  GetPermissionQueryDTO,
  UpdatePermissionBodyDTO,
} from 'src/routes/permission/permission.dto'
import { PermissionService } from 'src/routes/permission/permission.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('Permissions')
@Controller('permission')
@Auth([AuthType.Bearer])
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name)

  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all permissions',
    description: 'Retrieve paginated list of all permissions in the system. Admin only.',
  })
  @ApiOkResponse({ description: 'Permissions retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async findAll(@Query() query: GetPermissionQueryDTO) {
    try {
      this.logger.log('Get all permissions')
      const result = await this.permissionService.findAllPermissions({
        limit: query.limit,
        page: query.page,
      })
      return result
    } catch (error) {
      this.logger.error('Failed to get permissions', error.stack)
      throw error
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get permission by ID',
    description: 'Retrieve detailed information about a specific permission. Admin only.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Permission ID' })
  @ApiOkResponse({ description: 'Permission found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async findOne(@Param() id: GetPermissionParamDTO) {
    try {
      this.logger.log(`Get permission by ID: ${id.id}`)
      const result = await this.permissionService.findOnePermission(id)
      return result
    } catch (error) {
      this.logger.error(`Failed to get permission ${id.id}`, error.stack)
      throw error
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create permission',
    description: 'Create a new permission with name and description. Admin only.',
  })
  @ApiBody({ type: CreatePermissionBodyDTO, description: 'Permission creation data' })
  @ApiCreatedResponse({ description: 'Permission created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid permission data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  async create(@Body() body: CreatePermissionBodyDTO, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Create permission by user ${userId}`)
      const result = await this.permissionService.createPermission({
        data: body,
        userId,
      })
      this.logger.log('Permission created successfully')
      return result
    } catch (error) {
      this.logger.error('Failed to create permission', error.stack)
      throw error
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update permission',
    description: 'Update permission details. Admin only.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Permission ID' })
  @ApiBody({ type: UpdatePermissionBodyDTO, description: 'Updated permission fields' })
  @ApiOkResponse({ description: 'Permission updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid permission data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async update(
    @Param() param: GetPermissionParamDTO,
    @Body() body: UpdatePermissionBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    try {
      this.logger.log(`Update permission ${param.id} by user ${userId}`)
      const result = await this.permissionService.updatePermission({
        permissionId: param.id,
        data: body,
        userId,
      })
      this.logger.log(`Permission ${param.id} updated`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update permission ${param.id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete permission',
    description: 'Delete a permission from the system. Admin only.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Permission ID' })
  @ApiOkResponse({ description: 'Permission deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async delete(@Param() param: GetPermissionParamDTO, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Delete permission ${param.id} by user ${userId}`)
      const result = await this.permissionService.deletePermission({
        permissionId: param.id,
        userId,
      })
      this.logger.log(`Permission ${param.id} deleted`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete permission ${param.id}`, error.stack)
      throw error
    }
  }
}
