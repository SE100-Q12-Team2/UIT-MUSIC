import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { SharedRoleRepository } from 'src/shared/repository/shared-role.repo'
import { SharedUserRepository } from 'src/shared/repository/shared-user.repo'
import { PrismaService } from 'src/shared/services'
import { EmailService } from 'src/shared/services/email.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'

const sharedServices = [PrismaService, EmailService, SharedUserRepository, TokenService, HashingService, SharedRoleRepository]

@Global()
@Module({
  providers: [...sharedServices],
  exports: sharedServices,
  imports: [JwtModule],
})
export class SharedModule {}
