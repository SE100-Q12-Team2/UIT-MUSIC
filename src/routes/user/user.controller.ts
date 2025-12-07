import { Controller, Get, Patch, Delete, Param, Body, Query, Post, ParseIntPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger'
import { UserService } from './user.service'
import {
  CreateUserDto,
  GetUsersQueryDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  PaginatedUsersResponseDto,
  UserResponseDto,
  UserDetailResponseDto,
  UserStatisticsResponseDto,
} from './user.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('Users')
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name)

  constructor(private readonly userService: UserService) {}

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new user',
    description: 'Create a new user account. Requires admin or appropriate permissions.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User information including email, password, full name, and role',
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or validation failed',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Insufficient permissions to create user',
  })
  async createUser(@Body() body: CreateUserDto, @ActiveUser('userId') activeUserId: number): Promise<UserResponseDto> {
    try {
      this.logger.log(`Create user attempt by admin ID: ${activeUserId}`)
      const result = await this.userService.createUser(body, activeUserId)
      this.logger.log(`User created successfully: ${result.email}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to create user`, error.stack)
      throw error
    }
  }

  @Get()
  @Auth([AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve paginated list of users with optional filtering by role, status, and search query.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by user role' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by account status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or email' })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: PaginatedUsersResponseDto,
  })
  async getUsers(@Query() query: GetUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    try {
      this.logger.log(`Get users request with filters: ${JSON.stringify(query)}`)
      return await this.userService.getUsers(query)
    } catch (error) {
      this.logger.error('Failed to get users', error.stack)
      throw error
    }
  }

  @Get(':id')
  @Auth([AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve basic user information by user ID.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiOkResponse({
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    try {
      this.logger.log(`Get user by ID: ${id}`)
      return await this.userService.getUserById(id)
    } catch (error) {
      this.logger.error(`Failed to get user by ID: ${id}`, error.stack)
      throw error
    }
  }

  @Get(':id/detail')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get detailed user information',
    description: 'Retrieve detailed user information including subscriptions, devices, and activity. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiOkResponse({
    description: 'User details retrieved successfully',
    type: UserDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserDetailById(@Param('id', ParseIntPipe) id: number): Promise<UserDetailResponseDto> {
    try {
      this.logger.log(`Get user details for ID: ${id}`)
      return await this.userService.getUserDetailById(id)
    } catch (error) {
      this.logger.error(`Failed to get user details for ID: ${id}`, error.stack)
      throw error
    }
  }

  @Patch(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user information',
    description: 'Update user profile information. Requires admin or appropriate permissions.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID to update' })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User fields to update',
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or validation failed',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Insufficient permissions',
  })
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto): Promise<UserResponseDto> {
    try {
      this.logger.log(`Update user ID: ${id}`)
      const result = await this.userService.updateUser(id, body)
      this.logger.log(`User updated successfully ID: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update user ID: ${id}`, error.stack)
      throw error
    }
  }

  @Patch(':id/status')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user account status',
    description: 'Update user account status (Active, Inactive, Suspended, Banned). Admin only.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({
    type: UpdateUserStatusDto,
    description: 'New account status',
  })
  @ApiOkResponse({
    description: 'User status updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid status value',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin permissions required',
  })
  async updateUserStatus(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserStatusDto): Promise<UserResponseDto> {
    try {
      this.logger.log(`Update user status ID: ${id} to ${body.accountStatus}`)
      const result = await this.userService.updateUserStatus(id, body)
      this.logger.log(`User status updated successfully ID: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update user status ID: ${id}`, error.stack)
      throw error
    }
  }

  @Patch(':id/role')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user role',
    description: 'Update user role (Listener, Label, Admin). Admin only.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({
    type: UpdateUserRoleDto,
    description: 'New user role',
  })
  @ApiOkResponse({
    description: 'User role updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid role value',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin permissions required',
  })
  async updateUserRole(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserRoleDto): Promise<UserResponseDto> {
    try {
      this.logger.log(`Update user role ID: ${id} to role ID: ${body.roleId}`)
      const result = await this.userService.updateUserRole(id, body)
      this.logger.log(`User role updated successfully ID: ${id}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update user role ID: ${id}`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Soft delete user account. Admin only. User data will be marked as deleted.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID to delete' })
  @ApiOkResponse({
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User deleted successfully' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin permissions required',
  })
  async deleteUser(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') activeUserId): Promise<{ message: string }> {
    try {
      this.logger.log(`Delete user ID: ${id} by admin ID: ${activeUserId}`)
      await this.userService.deleteUser(id, activeUserId)
      this.logger.log(`User deleted successfully ID: ${id}`)
      return {
        message: 'User deleted successfully',
      }
    } catch (error) {
      this.logger.error(`Failed to delete user ID: ${id}`, error.stack)
      throw error
    }
  }

  @Get(':id/statistics')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Retrieve user activity statistics including listening history, playlists, and favorites.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiOkResponse({
    description: 'User statistics retrieved successfully',
    type: UserStatisticsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserStatistics(@Param('id', ParseIntPipe) userId: number): Promise<UserStatisticsResponseDto> {
    try {
      this.logger.log(`Get statistics for user ID: ${userId}`)
      return await this.userService.getUserStatistics(userId)
    } catch (error) {
      this.logger.error(`Failed to get statistics for user ID: ${userId}`, error.stack)
      throw error
    }
  }
}
