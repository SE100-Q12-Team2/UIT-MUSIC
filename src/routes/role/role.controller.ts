import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleBodyDTO, CreateRoleResDTO, GetRoleDetailResDTO, GetRoleQueryDTO, GetRolesResDTO, UpdateRoleBodyDTO, UpdateRoleResDTO } from 'src/routes/role/role.dto';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator';
import { ZodSerializerDto } from 'nestjs-zod';
import { MessageResDTO } from 'src/shared/dtos/response.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ZodSerializerDto(CreateRoleResDTO)
  create(@Body() data: CreateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return this.roleService.create({
      data,
      userId
    });
  }

  @Get()
  @ZodSerializerDto(GetRolesResDTO)
  findAll(@Query() query: GetRoleQueryDTO) {
    return this.roleService.findAll(query);
  }

  @Get(':id')
  @ZodSerializerDto(GetRoleDetailResDTO)
  findOne(@Param('id') roleId: string) {
    return this.roleService.findOne({
      id: +roleId
    });
  }

  @Patch(':id')
  @ZodSerializerDto(UpdateRoleResDTO)
  update(@Param('id') id: string, @Body() data: UpdateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return this.roleService.update({
      id: +id,
      data,
      userId
    });
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  remove(@Param('id') id: string, @ActiveUser('userId') userId: number) {
    return this.roleService.remove({
      id: +id,
      userId,
    });
  }
}
