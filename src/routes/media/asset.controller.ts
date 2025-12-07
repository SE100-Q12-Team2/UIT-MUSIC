import { Body, Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { AssetService } from './asset.service'
import { CreateMasterUploadBodyType, CreateMasterUploadBodySchema } from 'src/routes/media/media.model'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ZodValidationPipe } from 'nestjs-zod'

@ApiTags('Media Assets')
@Controller('media')
@Auth([AuthType.Bearer])
export class AssetController {
  private readonly logger = new Logger(AssetController.name)

  constructor(private assetService: AssetService) {}

  @Post('master/presign')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get presigned upload URL', description: 'Generate presigned URL for uploading master audio file to S3. Requires authentication.' })
  @ApiCreatedResponse({ description: 'Presigned URL generated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async presignMaster(@Body(new ZodValidationPipe(CreateMasterUploadBodySchema)) body: CreateMasterUploadBodyType) {
    try {
      this.logger.log(`Generate presigned URL for song ${body.songId}`)
      const out = await this.assetService.createMasterUpload(body.songId, body.fileName, body.tenant)
      return { ok: true, ...out }
    } catch (error) {
      this.logger.error('Failed to generate presigned URL', error.stack)
      throw error
    }
  }
}
