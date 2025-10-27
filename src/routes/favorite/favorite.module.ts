import { Module } from '@nestjs/common'
import { FavoriteController } from 'src/routes/favorite/favorite.controller'
import { FavoriteRepository } from 'src/routes/favorite/favorite.repo'
import { FavoriteService } from 'src/routes/favorite/favorite.service'

@Module({
  providers: [FavoriteService, FavoriteRepository],
  controllers: [FavoriteController],
  exports: [FavoriteService, FavoriteRepository],
})
export class FavoriteModule {}
