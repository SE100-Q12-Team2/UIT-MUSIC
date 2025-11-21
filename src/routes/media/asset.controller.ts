import { Body, Controller, Post } from '@nestjs/common'
import { AssetService } from './asset.service'
import { CreateMasterUploadBodyType } from 'src/routes/media/media.model'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@Controller('media')
@Auth([AuthType.Bearer])
export class AssetController {
  constructor(private assetService: AssetService) {}

  @Post('master/presign')
  async presignMaster(@Body() body: CreateMasterUploadBodyType) {
    const out = await this.assetService.createMasterUpload(body.songId, body.fileName, body.tenant)
    return { ok: true, ...out }
  }
}
