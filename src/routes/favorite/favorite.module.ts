import { Module } from '@nestjs/common'
import { FavoriteController } from 'src/routes/favorite/favorite.controller'
import { FavoriteRepository } from 'src/routes/favorite/favorite.repo'
import { FavoriteService } from 'src/routes/favorite/favorite.service'
import { ListeningHistoryModule } from 'src/routes/listening-history/listening-history.module'
import { ListeningHistoryRepository } from 'src/routes/listening-history/listening-history.repo'

@Module({
  providers: [FavoriteService, FavoriteRepository, ListeningHistoryRepository],
  controllers: [FavoriteController],
  imports: [ListeningHistoryModule],
  exports: [FavoriteService, FavoriteRepository],
})
export class FavoriteModule {}
