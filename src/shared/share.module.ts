import { Global, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { AccessTokenGuard } from 'src/shared/guard/access-token.guard'
import { AuthenticationGuard } from 'src/shared/guard/authentication.guard'
import { PaymentApiKeyGuard } from 'src/shared/guard/payment-api-key.guard'
import { SharedResetPasswordTokenRepo } from 'src/shared/repository/shared-reset-password-token.repo'
import { SharedRoleRepository } from 'src/shared/repository/shared-role.repo'
import { SharedUserRepository } from 'src/shared/repository/shared-user.repo'
import { PrismaService } from 'src/shared/services'
import { EmailService } from 'src/shared/services/email.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { S3IngestService } from 'src/shared/services/s3.service'
import { TokenService } from 'src/shared/services/token.service'
import { MeilisearchService } from 'src/shared/services/meilisearch.service'

const sharedServices = [
  PrismaService,
  EmailService,
  SharedUserRepository,
  TokenService,
  HashingService,
  S3IngestService,
  SharedRoleRepository,
  SharedResetPasswordTokenRepo,
  MeilisearchService,
]

@Global()
@Module({
  providers: [
    ...sharedServices,
    AccessTokenGuard,
    PaymentApiKeyGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
  exports: sharedServices,
  imports: [JwtModule],
})
export class SharedModule {}
