import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SharedModule } from 'src/shared/share.module'
import { AuthModule } from 'src/routes/auth/auth.module'
import { MediaModule } from 'src/routes/media/media.module'
import { CacheModule } from '@nestjs/cache-manager'
import envConfig from 'src/shared/config'
import { createKeyv } from '@keyv/redis'

@Module({
  imports: [
    SharedModule,
    AuthModule,
    MediaModule,
    CacheModule.register({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [createKeyv(envConfig.REDIS_CLOUD_URL)],
        }
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
