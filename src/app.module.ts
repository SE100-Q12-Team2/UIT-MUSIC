import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SharedModule } from 'src/shared/share.module'
import { AuthModule } from 'src/routes/auth/auth.module'
import { MediaModule } from 'src/routes/media/media.module'

@Module({
  imports: [SharedModule, AuthModule, MediaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
