# Recommendation Engine Guide

## Overview

The UIT Music recommendation engine uses a **hybrid approach** combining collaborative filtering and content-based filtering to provide personalized song recommendations.

## Architecture

### Components

- **RecommendationService**: Core recommendation logic
- **RecommendationController**: REST API endpoints
- **RecommendationModule**: NestJS module configuration

### Algorithm Strategy

#### 1. Personalized Recommendations

Combines multiple signals:

- **User Listening History**: Songs the user has played recently
- **User Favorites**: Songs the user has favorited
- **User Ratings**: Explicit ratings provided by the user
- **Genre Preferences**: Extracted from listening patterns
- **Artist Preferences**: Based on frequently played artists
- **Collaborative Filtering**: "Users who liked X also liked Y"

**Scoring Weights:**

- Listening History: 30%
- Favorites: 25%
- User Ratings: 20%
- Collaborative: 15%
- Content-Based: 10%

#### 2. Similar Songs

Content-based filtering using:

- Genre matching (70% weight)
- Artist matching (30% weight)
- Excludes the input song from results

#### 3. Trending Recommendations

- Based on play count (logarithmic scaling)
- Returns top 50 trending songs
- Updated in real-time

#### 4. Genre-Based Recommendations

- Filters songs by specific genre
- Excludes songs user already listened to
- Sorted by play count

#### 5. Artist-Based Recommendations

- All songs from a specific artist
- Excludes user's listening history
- Sorted by play count

## API Endpoints

### 1. Get Personalized Recommendations

```http
GET /recommendations/personalized?limit=20
Authorization: Bearer <token>
```

**Query Parameters:**

- `limit` (optional): Number of recommendations (default: 20)

**Response:**

```json
[
  {
    "id": 123,
    "title": "Song Title",
    "artist": { ... },
    "album": { ... },
    "genre": { ... },
    "playCount": 50000
  }
]
```

### 2. Get Similar Songs

```http
GET /recommendations/similar/:songId?limit=10
```

**Path Parameters:**

- `songId`: ID of the reference song

**Query Parameters:**

- `limit` (optional): Number of recommendations (default: 10)

### 3. Get Trending Recommendations

```http
GET /recommendations/trending?limit=20
```

**Query Parameters:**

- `limit` (optional): Number of recommendations (default: 20)

### 4. Get Genre-Based Recommendations

```http
GET /recommendations/genre/:genreId?limit=20
Authorization: Bearer <token>
```

**Path Parameters:**

- `genreId`: ID of the genre

**Query Parameters:**

- `limit` (optional): Number of recommendations (default: 20)

### 5. Get Artist-Based Recommendations

```http
GET /recommendations/artist/:artistId?limit=20
Authorization: Bearer <token>
```

**Path Parameters:**

- `artistId`: ID of the artist

**Query Parameters:**

- `limit` (optional): Number of recommendations (default: 20)

## Implementation Details

### Collaborative Filtering

```typescript
// Find users who liked similar songs
const similarUsers = await this.findSimilarUsers(userId, likedSongIds)

// Get songs those users liked
const recommendations = await this.getSongsFromSimilarUsers(similarUsers, excludeIds)
```

### Content-Based Filtering

```typescript
// Extract user preferences
const preferredGenres = this.extractGenrePreferences(userHistory)
const preferredArtists = this.extractArtistPreferences(userHistory)

// Find matching songs
const genreMatches = await this.findSongsByGenres(preferredGenres)
const artistMatches = await this.findSongsByArtists(preferredArtists)
```

### Score Combination

```typescript
private combineScores(strategies: Array<{
  scores: RecommendationScore[]
  weight: number
}>): RecommendationScore[] {
  // Weighted sum of all strategies
  // Normalized to 0-100 range
  // Sorted by final score
}
```

## Database Schema Usage

### Required Tables

- `Song`: Song metadata (title, genre, artist, playCount)
- `ListeningHistory`: User play history
- `Favorite`: User favorites
- `UserSongRating`: User ratings (1-5 stars)
- `Genre`: Genre information
- `Artist`: Artist information

### Optimizations

- Indexed queries on `userId`, `songId`, `genreId`, `artistId`
- Limit historical data to last 100 listening sessions
- Use `select` to fetch only required fields

## Performance Considerations

### Caching Strategy (Recommended)

```typescript
// Cache personalized recommendations for 1 hour
@CacheTTL(3600)
async getPersonalizedRecommendations(userId: number, limit: number)

// Cache similar songs for 24 hours
@CacheTTL(86400)
async getSimilarSongs(songId: number, limit: number)

// Cache trending for 30 minutes
@CacheTTL(1800)
async getTrendingRecommendations(limit: number)
```

### Query Optimization

- Parallel fetching of user data (history, favorites, ratings)
- Batch processing of recommendation scores
- Limited result sets to prevent over-fetching

## Future Enhancements

### Short-term

1. **A/B Testing**: Test different weight combinations
2. **Real-time Updates**: WebSocket for live recommendation updates
3. **Diversity**: Ensure genre/artist diversity in recommendations
4. **Cold Start**: Better handling for new users with no history

### Long-term

1. **Machine Learning**: Train neural network for better predictions
2. **Contextual**: Time-of-day, mood-based recommendations
3. **Social**: Friend-based collaborative filtering
4. **Audio Features**: Use Spotify-like audio analysis (tempo, energy, etc.)

## Testing

### Unit Tests

```bash
npm run test -- recommendation.service.spec.ts
```

### Integration Tests

```bash
npm run test:e2e -- recommendation.e2e-spec.ts
```

### Manual Testing

1. Create test user with varied listening history
2. Test each endpoint with Swagger UI at `/api/docs`
3. Verify recommendation quality and diversity
4. Check response times (<500ms for personalized)

## Monitoring

### Key Metrics

- **Recommendation CTR**: Click-through rate on recommendations
- **Diversity Score**: Unique genres/artists in top 20
- **Response Time**: P50, P95, P99 latencies
- **Cache Hit Rate**: Percentage of cached responses

### Logging

```typescript
this.logger.log(`Generated ${recommendations.length} personalized recommendations for user ${userId}`)
this.logger.debug(`Recommendation scores: ${JSON.stringify(topScores)}`)
```

## Troubleshooting

### Issue: No recommendations returned

**Cause**: User has no listening history or favorites
**Solution**: Fall back to trending recommendations

### Issue: All recommendations are same genre

**Cause**: User only listens to one genre
**Solution**: Add diversity penalty in scoring algorithm

### Issue: Slow response times

**Cause**: Large listening history, complex queries
**Solution**: Implement caching, limit history to 100 items

## Swagger Documentation

All endpoints are fully documented in Swagger UI at `/api/docs` under the **Recommendations** tag.
