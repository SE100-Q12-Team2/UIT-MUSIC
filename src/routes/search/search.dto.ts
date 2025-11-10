import { createZodDto } from 'nestjs-zod'
import {
  SearchQuerySchema,
  SearchResultSchema,
  SearchSuggestionsSchema,
  SuggestionsResponseSchema,
  TrendingResponseSchema,
} from 'src/routes/search/search.model'

export class SearchQueryDto extends createZodDto(SearchQuerySchema) {}

export class SearchSuggestionsDto extends createZodDto(SearchSuggestionsSchema) {}

export class SearchResultDto extends createZodDto(SearchResultSchema) {}

export class SuggestionsResponseDto extends createZodDto(SuggestionsResponseSchema) {}

export class TrendingResponseDto extends createZodDto(TrendingResponseSchema) {}
