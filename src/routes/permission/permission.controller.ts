import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import {
  CreatePermissionBodyDTO,
  GetPermissionParamDTO,
  GetPermissionQueryDTO,
  UpdatePermissionBodyDTO,
} from 'src/routes/permission/permission.dto'
import { PermissionService } from 'src/routes/permission/permission.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  async findAll(@Query() query: GetPermissionQueryDTO) {
    return this.permissionService.findAllPermissions({
      limit: query.limit,
      page: query.page,
    })
  }

  @Get(':id')
  async findOne(@Param() id: GetPermissionParamDTO) {
    return this.permissionService.findOnePermission(id)
  }

  @Post()
  async create(@Body() body: CreatePermissionBodyDTO, @ActiveUser('userId') userId: number) {
    return this.permissionService.createPermission({
      data: body,
      userId,
    })
  }

  @Put(':id')
  async update(@Param() param: GetPermissionParamDTO, @Body() body: UpdatePermissionBodyDTO, @ActiveUser('userId') userId: number) {
    return this.permissionService.updatePermission({
      permissionId: param.id,
      data: body,
      userId
    })
  }

  @Delete(':id')
  async delete(@Param() param: GetPermissionParamDTO, @ActiveUser('userId') userId: number) {
    return this.permissionService.deletePermission({
      permissionId: param.id,
      userId
    })
  }
}
