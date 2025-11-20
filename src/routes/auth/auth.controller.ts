import { Body, Controller, Ip, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { builtinModules } from 'module'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  ForgotPasswordBodyDTO,
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  ResetPasswordBodyDTO,
  SendOTPBodyDTO,
} from 'src/routes/auth/auth.dto'
import { AuthService } from 'src/routes/auth/auth.service'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { UserAgent } from 'src/shared/decorators/user-agent.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Send OTP code',
    description: 'Send a one-time password to the user email for registration or password reset verification',
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email or request' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body)
  }

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResDTO)
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account with email verification using OTP code',
  })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: RegisterResDTO })
  @ApiResponse({ status: 400, description: 'Invalid registration data or OTP' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body)
  }

  @Post('login')
  @IsPublic()
  @ZodSerializerDto(LoginResDTO)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password, returns access and refresh tokens',
  })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResDTO })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account is locked or inactive' })
  async login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() userIp: string) {
    return await this.authService.login({
      ...body,
      userAgent,
      ip: userIp,
    })
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidate refresh token and log out user from current device',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async logout(@Body() body: LogoutBodyDTO) {
    return await this.authService.logout(body.refreshToken)
  }

  @Post('forgot-password')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset OTP code to user email',
  })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async forgotPassword(@Body() forgotPasswordBody: ForgotPasswordBodyDTO) {
    return await this.authService.forgotPassword(forgotPasswordBody)
  }

  @Post('reset-password')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password using OTP code verification',
  })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or password' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Body() body: ResetPasswordBodyDTO) {
    return await this.authService.resetPasswordWithToken(body)
  }
}
