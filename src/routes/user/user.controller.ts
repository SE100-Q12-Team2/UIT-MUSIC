import { Controller, Get, Patch, Delete, Param, Body, Query, Post, ParseIntPipe } from '@nestjs/common'
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

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Auth([AuthType.Bearer])
  async createUser(@Body() body: CreateUserDto, @ActiveUser('userId') activeUserId: number): Promise<UserResponseDto> {
    return this.userService.createUser(body, activeUserId)
  }

  @Get()
  @Auth([AuthType.None])
  async getUsers(@Query() query: GetUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    return this.userService.getUsers(query)
  }

  @Get(':id')
  @Auth([AuthType.None])
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.userService.getUserById(id)
  }

  @Get(':id/detail')
  @Auth([AuthType.Bearer])
  async getUserDetailById(@Param('id', ParseIntPipe) id: number): Promise<UserDetailResponseDto> {
    return this.userService.getUserDetailById(id)
  }

  @Patch(':id')
  @Auth([AuthType.Bearer])
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto): Promise<UserResponseDto> {
    return this.userService.updateUser(id, body)
  }

  @Patch(':id/status')
  @Auth([AuthType.Bearer])
  async updateUserStatus(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserStatusDto): Promise<UserResponseDto> {
    return this.userService.updateUserStatus(id, body)
  }

  @Patch(':id/role')
  @Auth([AuthType.Bearer])
  async updateUserRole(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserRoleDto): Promise<UserResponseDto> {
    return this.userService.updateUserRole(id, body)
  }

  @Delete(':id')
  @Auth([AuthType.Bearer])
  async deleteUser(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') activeUserId): Promise<{ message: string }> {
    await this.userService.deleteUser(id, activeUserId)
    return {
      message: 'User deleted successfully',
    }
  }

  @Get(':id/statistics')
  @Auth([AuthType.Bearer])
  async getUserStatistics(@Param('id', ParseIntPipe) userId: number): Promise<UserStatisticsResponseDto> {
    return this.userService.getUserStatistics(userId)
  }
}
