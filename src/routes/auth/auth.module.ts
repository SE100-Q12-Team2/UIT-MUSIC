import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { FacebookService } from './facebook.service'
import { GoogleService } from 'src/routes/auth/google.service'

@Module({
  providers: [AuthService, AuthRepository, GoogleService, FacebookService],
  controllers: [AuthController],
})
export class AuthModule {}
