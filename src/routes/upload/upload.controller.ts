import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { UploadService } from './upload.service'
import { GeneratePresignedUrlBodyDTO, GeneratePresignedUrlResDTO, ImageUploadBodyDTO } from './upload.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name)

  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.CREATED)
  @Auth([AuthType.Bearer])
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(GeneratePresignedUrlResDTO)
  @ApiOperation({
    summary: 'Generate presigned URL for file upload',
    description:
      'Generate a presigned URL that allows direct upload to S3. The client can use this URL to PUT the file directly to S3.',
  })
  @ApiCreatedResponse({
    description: 'Presigned URL generated successfully',
    type: GeneratePresignedUrlResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request - check file name and extension',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async generatePresignedUrl(@Body() body: GeneratePresignedUrlBodyDTO, @ActiveUser('userId') userId?: number) {
    try {
      this.logger.log(`User ${userId} requesting presigned URL for ${body.fileName}`)
      const result = await this.uploadService.generatePresignedUrl(body, userId)
      return { ok: true, ...result }
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`, error.stack)
      throw error
    }
  }

  @Post('image/presigned-url')
  @HttpCode(HttpStatus.CREATED)
  @Auth([AuthType.Bearer])
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(GeneratePresignedUrlResDTO)
  @ApiOperation({
    summary: 'Generate presigned URL for image upload',
    description:
      'Generate a presigned URL specifically for image uploads (avatars, covers, etc.). Only image file types are allowed.',
  })
  @ApiCreatedResponse({
    description: 'Image upload URL generated successfully',
    type: GeneratePresignedUrlResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid image file - only jpg, jpeg, png, gif, webp, bmp, svg allowed',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async generateImageUploadUrl(@Body() body: ImageUploadBodyDTO, @ActiveUser('userId') userId?: number) {
    try {
      this.logger.log(`User ${userId} requesting image upload URL for ${body.fileName}`)
      const result = await this.uploadService.generateImageUploadUrl(body, userId)
      return { ok: true, ...result }
    } catch (error) {
      this.logger.error(`Failed to generate image upload URL: ${error.message}`, error.stack)
      throw error
    }
  }
}
