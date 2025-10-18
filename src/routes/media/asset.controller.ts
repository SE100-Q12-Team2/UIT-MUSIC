import { Body, Controller, Post } from '@nestjs/common'
import { AssetService } from './asset.service'
import { CreateMasterUploadBodySchema, CreateMasterUploadBodyType } from 'src/routes/media/media.model'

@Controller('media')
export class AssetController {
  constructor(private assetService: AssetService) {}

  @Post('master/presign')
  async presignMaster(@Body() body: CreateMasterUploadBodyType) {
    const out = await this.assetService.createMasterUpload(body.songId, body.fileName, body.tenant)
    return { ok: true, ...out }
  }
}
