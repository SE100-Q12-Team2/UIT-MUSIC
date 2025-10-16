import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { SharedResetPasswordTokenRepo } from 'src/shared/repository/shared-reset-password-token.repo'
import { SharedRoleRepository } from 'src/shared/repository/shared-role.repo'
import { SharedUserRepository } from 'src/shared/repository/shared-user.repo'
import { PrismaService } from 'src/shared/services'
import { EmailService } from 'src/shared/services/email.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { S3IngestService } from 'src/shared/services/s3.service'
import { TokenService } from 'src/shared/services/token.service'

const sharedServices = [
  PrismaService,
  EmailService,
  SharedUserRepository,
  TokenService,
  HashingService,
  S3IngestService,
  SharedRoleRepository,
  SharedResetPasswordTokenRepo,
]

@Global()
@Module({
  providers: [...sharedServices],
  exports: sharedServices,
  imports: [JwtModule],
})
export class SharedModule {}
