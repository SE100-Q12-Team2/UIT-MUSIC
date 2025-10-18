import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { PermissionRepository } from 'src/routes/permission/permission.repo';

@Module({
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepository]
})
export class PermissionModule {}
