import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleBodyDTO, CreateRoleResDTO, GetRoleDetailResDTO, GetRoleQueryDTO, GetRolesResDTO, UpdateRoleBodyDTO, UpdateRoleResDTO } from 'src/routes/role/role.dto';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator';
import { ZodSerializerDto } from 'nestjs-zod';
import { MessageResDTO } from 'src/shared/dtos/response.dto';
import { Auth } from 'src/shared/decorators/auth.decorator';
import { AuthType } from 'src/shared/constants/auth.constant';

@ApiTags('Roles')
@Controller('role')
@Auth([AuthType.Bearer])
export class RoleController {
  private readonly logger = new Logger(RoleController.name)

  constructor(private readonly roleService: RoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(CreateRoleResDTO)
  @ApiOperation({
    summary: 'Create role',
    description: 'Create a new role with permissions. Admin only.',
  })
  @ApiBody({ type: CreateRoleBodyDTO, description: 'Role creation data' })
  @ApiCreatedResponse({ description: 'Role created successfully', type: CreateRoleResDTO })
  @ApiBadRequestResponse({ description: 'Invalid role data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  create(@Body() data: CreateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Create role by user ${userId}`)
      const result = this.roleService.create({
        data,
        userId
      });
      this.logger.log('Role created successfully')
      return result
    } catch (error) {
      this.logger.error('Failed to create role', error.stack)
      throw error
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(GetRolesResDTO)
  @ApiOperation({
    summary: 'Get all roles',
    description: 'Retrieve paginated list of all roles with their permissions. Admin only.',
  })
  @ApiOkResponse({ description: 'Roles retrieved successfully', type: GetRolesResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  findAll(@Query() query: GetRoleQueryDTO) {
    try {
      this.logger.log('Get all roles')
      const result = this.roleService.findAll(query);
      return result
    } catch (error) {
      this.logger.error('Failed to get roles', error.stack)
      throw error
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(GetRoleDetailResDTO)
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Retrieve detailed information about a specific role including all permissions. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @ApiOkResponse({ description: 'Role found', type: GetRoleDetailResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  findOne(@Param('id') roleId: string) {
    try {
      this.logger.log(`Get role by ID: ${roleId}`)
      const result = this.roleService.findOne({
        id: +roleId
      });
      return result
    } catch (error) {
      this.logger.error(`Failed to get role ${roleId}`, error.stack)
      throw error
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(UpdateRoleResDTO)
  @ApiOperation({
    summary: 'Update role',
    description: 'Update role details and permissions. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @ApiBody({ type: UpdateRoleBodyDTO, description: 'Updated role fields' })
  @ApiOkResponse({ description: 'Role updated successfully', type: UpdateRoleResDTO })
  @ApiBadRequestResponse({ description: 'Invalid role data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  update(@Param('id') id: string, @Body() data: UpdateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Update role ${id} by user ${userId}`)
      const result = this.roleService.update({
        id: +id,
        data,
        userId
      });
      this.logger.log(`Role ${id} updated`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update role ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Delete role',
    description: 'Delete a role from the system. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @ApiOkResponse({ description: 'Role deleted successfully', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Admin access required' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  remove(@Param('id') id: string, @ActiveUser('userId') userId: number) {
    try {
      this.logger.log(`Delete role ${id} by user ${userId}`)
      const result = this.roleService.remove({
        id: +id,
        userId,
      });
      this.logger.log(`Role ${id} deleted`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete role ${id}`, error.stack)
      throw error
    }
  }
}
