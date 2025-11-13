import { SearchType } from 'src/shared/constants/search.constant'
import { z } from 'zod'

export const SearchQuerySchema = z
  .object({
    query: z.string().min(1, 'Query is required').max(255, 'Query is too long'),
    type: z.enum(SearchType).optional().default(SearchType.ALL),
    page: z.coerce.number().int().min(1, 'Page must be at least 1').optional().default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit cannot exceed 100')
      .optional()
      .default(20),
  })
  .strict()

export const SearchSuggestionsSchema = z
  .object({
    query: z.string().min(1, 'Query is required').max(255, 'Query is too long'),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'Limit must be at least 1')
      .max(20, 'Limit cannot exceed 20')
      .optional()
      .default(10),
  })
  .strict()

export const SearchSuggestionItemSchema = z.object({
  type: z.enum(['song', 'artist', 'album']),
  id: z.number(),
  text: z.string(),
})

export const TrendingSearchItemSchema = z.object({
  id: z.number(),
  text: z.string(),
  type: z.string(),
  artists: z.array(z.string()).optional(),
})

export const PaginatedResultSchema = z.object({
  items: z.array(z.any()),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const SearchResultSchema = z.object({
  songs: PaginatedResultSchema.optional(),
  albums: PaginatedResultSchema.optional(),
  artists: PaginatedResultSchema.optional(),
  playlists: PaginatedResultSchema.optional(),
  users: PaginatedResultSchema.optional(),
})

export const SuggestionsResponseSchema = z.object({
  suggestions: z.array(SearchSuggestionItemSchema),
})

export const TrendingResponseSchema = z.object({
  trending: z.array(TrendingSearchItemSchema),
})

export type SearchQueryType = z.infer<typeof SearchQuerySchema>
export type SearchSuggestionsType = z.infer<typeof SearchSuggestionsSchema>
export type SearchResultType = z.infer<typeof SearchResultSchema>
export type SuggestionsResponseType = z.infer<typeof SuggestionsResponseSchema>
export type TrendingResponseType = z.infer<typeof TrendingResponseSchema>
