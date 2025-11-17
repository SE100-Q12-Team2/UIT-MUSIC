import { Module } from '@nestjs/common'
import { SearchController } from 'src/routes/search/search.controller'
import { SearchMeilisearchService } from 'src/routes/search/search-meilisearch.service'
import { SearchIndexService } from 'src/routes/search/search-index.service'
import { SearchSyncListener } from 'src/routes/search/search-sync.listener'
import { SharedModule } from 'src/shared/share.module'

@Module({
  imports: [SharedModule],
  controllers: [SearchController],
  providers: [
    SearchMeilisearchService,
    SearchIndexService,
    SearchSyncListener,
    {
      provide: 'SearchService',
      useExisting: SearchMeilisearchService,
    },
  ],
  exports: [SearchMeilisearchService, SearchIndexService],
})
export class SearchModule {}
