import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'

@Module({
  controllers: [],
  providers: [],
  imports: [
    MulterModule.register({
    }),
  ],
})

export class MediaModule {}