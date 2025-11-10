import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { SearchService } from './search.service'
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

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Auth([AuthType.Bearer, AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SearchResultDto)
  async search(@Query() searchDto: SearchQueryDto, @ActiveUser('userId') userId?: number) {
    return this.searchService.search(searchDto, userId)
  }

  @Get('suggestions')
  @Auth([AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SuggestionsResponseDto)
  async getSuggestions(@Query() dto: SearchSuggestionsDto) {
    return this.searchService.getSuggestions(dto.query, dto.limit)
  }

  @Get('trending')
  @Auth([AuthType.None])
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(TrendingResponseDto)
  async getTrendingSearches(@Query('limit') limit?: number) {
    return this.searchService.getTrendingSearches(limit ? +limit : 10)
  }
}
