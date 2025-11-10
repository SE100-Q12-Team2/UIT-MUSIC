import { Module } from '@nestjs/common'
import { SearchController } from 'src/routes/search/search.controller'
import { SearchService } from 'src/routes/search/search.service'
import { SearchRepository } from 'src/routes/search/search.repo'
import { SharedModule } from 'src/shared/share.module'

@Module({
  imports: [SharedModule],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository],
  exports: [SearchService],
})
export class SearchModule {}
