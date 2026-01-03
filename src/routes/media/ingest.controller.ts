import { Body, Controller, Headers, Post, UnauthorizedException, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiHeader, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { IngestService } from 'src/routes/media/ingest.service'
import { IngestCompleteBodyType, IngestCompleteBodySchema } from 'src/routes/media/media.model'
import { ZodValidationPipe } from 'nestjs-zod'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

@ApiTags('Media Ingest')
@Controller('internal/ingest')
export class IngestController {
  private readonly logger = new Logger(IngestController.name)

  constructor(private ingestService: IngestService) {}

  @IsPublic()
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ingest complete callback', description: 'Internal webhook for media processing completion. Requires ingest token.' })
  @ApiHeader({ name: 'x-ingest-token', required: true, description: 'Ingest authentication token' })
  @ApiOkResponse({ description: 'Ingest processed successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid ingest token' })
  async complete(@Body(new ZodValidationPipe(IngestCompleteBodySchema)) body: IngestCompleteBodyType, @Headers('x-ingest-token') token: string) {
    console.log('RENDITIONS:', body.renditions)
    console.log('IS ARRAY:', Array.isArray(body.renditions))
    try {
      this.logger.log(`Ingest complete for song ${body.songId}`)
      const result = await this.ingestService.complete(body, token)
      this.logger.log(`Ingest complete processed for song ${body.songId}`)
      return result
    } catch (error) {
      this.logger.error('Failed to process ingest complete', error.stack)
      throw error
    }
  }
}
