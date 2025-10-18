import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common'
import { IngestService } from 'src/routes/media/ingest.service'
import { IngestCompleteBodyType } from 'src/routes/media/media.model'

@Controller('internal/ingest')
export class IngestController {
  constructor(private ingestService: IngestService) {}

  @Post('complete')
  async complete(@Body() body: IngestCompleteBodyType, @Headers('x-ingest-token') token: string) {
    console.log('Ingest complete called with body:', body, 'and token:', token)
    return await this.ingestService.complete(body, token)
  }
}
