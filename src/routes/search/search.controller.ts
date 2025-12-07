import { Controller, Get, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiQuery } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'
import { SearchMeilisearchService } from './search-meilisearch.service'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import {
  SearchQueryDto,
  SearchSuggestionsDto,
  SearchResultDto,
  SuggestionsResponseDto,
  TrendingResponseDto,
} from 'src/routes/search/search.dto'

@ApiTags('Search')
@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name)

  constructor(private readonly searchService: SearchMeilisearchService) {}

  @Get()
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SearchResultDto)
  @ApiOperation({
    summary: 'Global search',
    description: 'Search across songs, albums, artists, and playlists using full-text search with filters. Supports pagination, sorting, and faceted search. Available to authenticated and non-authenticated users.',
  })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query string' })
  @ApiQuery({ name: 'type', required: false, enum: ['song', 'album', 'artist', 'playlist'], description: 'Filter by content type' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Results per page (default: 20)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination (default: 0)' })
  @ApiOkResponse({ description: 'Search results retrieved successfully', type: SearchResultDto })
  async search(@Query() searchDto: SearchQueryDto, @ActiveUser('userId') userId?: number) {
    try {
      const result = await this.searchService.search(searchDto, userId)
      return result
    } catch (error) {
      throw error
    }
  }

  @Get('suggestions')
  @Auth([AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SuggestionsResponseDto)
  @ApiOperation({
    summary: 'Get search suggestions',
    description: 'Get autocomplete suggestions for search queries based on partial input. Provides instant suggestions for songs, artists, albums, and playlists.',
  })
  @ApiQuery({ name: 'query', required: true, type: String, description: 'Partial search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of suggestions (default: 5)' })
  @ApiOkResponse({ description: 'Suggestions retrieved successfully', type: SuggestionsResponseDto })
  async getSuggestions(@Query() dto: SearchSuggestionsDto) {
    try {
      this.logger.log(`Get suggestions for: "${dto.query}"`)
      const result = await this.searchService.getSuggestions(dto.query, dto.limit)
      this.logger.log(`Suggestions retrieved for: "${dto.query}"`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get suggestions for: "${dto.query}"`, error.stack)
      throw error
    }
  }

  @Get('trending')
  @Auth([AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(TrendingResponseDto)
  @ApiOperation({
    summary: 'Get trending searches',
    description: 'Retrieve the most popular search queries over recent time period. Useful for displaying trending content and popular searches to users.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of trending searches (default: 10)' })
  @ApiOkResponse({ description: 'Trending searches retrieved successfully', type: TrendingResponseDto })
  async getTrendingSearches(@Query('limit') limit?: number) {
    try {
      const limitNum = limit ? +limit : 10
      this.logger.log(`Get trending searches, limit: ${limitNum}`)
      const result = await this.searchService.getTrendingSearches(limitNum)
      this.logger.log('Trending searches retrieved successfully')
      return result
    } catch (error) {
      this.logger.error('Failed to get trending searches', error.stack)
      throw error
    }
  }
}
