import { Body, Controller, Ip, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiTooManyRequestsResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  ForgotPasswordBodyDTO,
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  RefreshTokenBodyDTO,
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
  private readonly logger = new Logger(AuthController.name)

  constructor(private readonly authService: AuthService) {}

  @Post('otp')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Send OTP code',
    description: 'Send a one-time password to the user email for registration or password reset verification. OTP expires after configured time.',
  })
  @ApiBody({ 
    type: SendOTPBodyDTO,
    description: 'Email address and verification type (REGISTER or FORGOT_PASSWORD)',
  })
  @ApiOkResponse({ 
    description: 'OTP sent successfully to the provided email',
    type: MessageResDTO,
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid email format or request body validation failed',
  })
  @ApiTooManyRequestsResponse({ 
    description: 'Too many OTP requests. Please try again later.',
  })
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    try {
      this.logger.log(`OTP request for email: ${body.email}, type: ${body.type}`)
      const result = await this.authService.sendOTP(body)
      this.logger.log(`OTP sent successfully to: ${body.email}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to send OTP to: ${body.email}`, error.stack)
      throw error
    }
  }

  @Post('register')
  @IsPublic()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(RegisterResDTO)
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account with email verification using OTP code. Email must be verified before registration.',
  })
  @ApiBody({ 
    type: RegisterBodyDTO,
    description: 'User registration information including email, password, full name, and OTP code',
  })
  @ApiCreatedResponse({ 
    description: 'User registered successfully. Returns user profile without password.',
    type: RegisterResDTO,
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid registration data, OTP verification failed, or password mismatch',
  })
  @ApiConflictResponse({ 
    description: 'Email already exists in the system',
  })
  async register(@Body() body: RegisterBodyDTO) {
    try {
      this.logger.log(`Registration attempt for email: ${body.email}`)
      const result = await this.authService.register(body)
      this.logger.log(`Registration successful for email: ${body.email}`)
      return result
    } catch (error) {
      this.logger.error(`Registration failed for email: ${body.email}`, error.stack)
      throw error
    }
  }

  @Post('login')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LoginResDTO)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password. Returns access and refresh tokens for session management. Device information is tracked.',
  })
  @ApiBody({ 
    type: LoginBodyDTO,
    description: 'Login credentials (email and password)',
  })
  @ApiOkResponse({ 
    description: 'Login successful. Returns JWT access token and refresh token.',
    type: LoginResDTO,
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid credentials - wrong email or password',
  })
  @ApiForbiddenResponse({ 
    description: 'Account is locked, suspended, banned or inactive',
  })
  async login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() userIp: string) {
    try {
      this.logger.log(`Login attempt for email: ${body.email} from IP: ${userIp}`)
      const result = await this.authService.login({
        ...body,
        userAgent,
        ip: userIp,
      })
      this.logger.log(`Login successful for email: ${body.email}`)
      return result
    } catch (error) {
      this.logger.error(`Login failed for email: ${body.email}`, error.stack)
      throw error
    }
  }

  @Post('refresh-token')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LoginResDTO)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access and refresh tokens using a valid refresh token. Old refresh token will be revoked (rotation strategy).',
  })
  @ApiBody({ 
    type: RefreshTokenBodyDTO,
    description: 'Valid refresh token obtained from login or previous refresh',
  })
  @ApiOkResponse({ 
    description: 'Token refreshed successfully. Returns new access token and refresh token.',
    type: LoginResDTO,
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid, expired, or already used refresh token',
  })
  async refreshToken(@Body() body: RefreshTokenBodyDTO) {
    try {
      this.logger.log('Token refresh attempt')
      const result = await this.authService.refreshToken(body.refreshToken)
      this.logger.log('Token refreshed successfully')
      return result
    } catch (error) {
      this.logger.error('Token refresh failed', error.stack)
      throw error
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidate refresh token and log out user from current device. Device will be marked as inactive.',
  })
  @ApiBody({ 
    type: LogoutBodyDTO,
    description: 'Refresh token to be invalidated',
  })
  @ApiOkResponse({ 
    description: 'Logout successful. Token has been invalidated and device marked as inactive.',
    type: MessageResDTO,
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid or expired refresh token',
  })
  async logout(@Body() body: LogoutBodyDTO) {
    try {
      this.logger.log('Logout attempt')
      const result = await this.authService.logout(body.refreshToken)
      this.logger.log('Logout successful')
      return result
    } catch (error) {
      this.logger.error('Logout failed', error.stack)
      throw error
    }
  }

  @Post('forgot-password')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset link with token to user email. Token expires after configured time.',
  })
  @ApiBody({ 
    type: ForgotPasswordBodyDTO,
    description: 'Email address of the account to reset password',
  })
  @ApiOkResponse({ 
    description: 'Password reset link sent successfully to email',
    type: MessageResDTO,
  })
  @ApiNotFoundResponse({ 
    description: 'Email address not found in the system',
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid email format',
  })
  async forgotPassword(@Body() forgotPasswordBody: ForgotPasswordBodyDTO) {
    try {
      this.logger.log(`Password reset request for email: ${forgotPasswordBody.email}`)
      const result = await this.authService.forgotPassword(forgotPasswordBody)
      this.logger.log(`Password reset link sent to: ${forgotPasswordBody.email}`)
      return result
    } catch (error) {
      this.logger.error(`Password reset request failed for: ${forgotPasswordBody.email}`, error.stack)
      throw error
    }
  }

  @Post('reset-password')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password using reset token from email. All existing sessions will be invalidated.',
  })
  @ApiBody({ 
    type: ResetPasswordBodyDTO,
    description: 'Reset token, new password and password confirmation',
  })
  @ApiOkResponse({ 
    description: 'Password reset successful. All sessions have been invalidated. Please login again.',
    type: MessageResDTO,
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid or expired reset token, password mismatch, or validation failed',
  })
  @ApiNotFoundResponse({ 
    description: 'User associated with reset token not found',
  })
  async resetPassword(@Body() body: ResetPasswordBodyDTO) {
    try {
      this.logger.log('Password reset attempt with token')
      const result = await this.authService.resetPasswordWithToken(body)
      this.logger.log('Password reset successful')
      return result
    } catch (error) {
      this.logger.error('Password reset failed', error.stack)
      throw error
    }
  }
}
