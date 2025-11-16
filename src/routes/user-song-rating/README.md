# User Song Rating Module

This module provides comprehensive Like/Dislike functionality for songs, enabling user engagement and personalized recommendations.

## Features

- **Like/Dislike Songs**: Simple binary rating system (Like or Dislike)
- **Rating Statistics**: Aggregated stats for songs (total ratings, likes, dislikes, percentages)
- **User Rating History**: View all rated songs with pagination and filtering
- **Liked Songs Collection**: Separate endpoint for accessing only liked songs
- **Personal Statistics**: User's rating summary and recent activity

## Database Schema

```prisma
model UserSongRating {
  userId    Int
  songId    Int
  rating    Rating    // Like or Dislike
  ratedAt   DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  song Song @relation(fields: [songId], references: [id], onDelete: Cascade)

  @@id([userId, songId])
}

enum Rating {
  Like
  Dislike
}
```

## API Endpoints

### User Endpoints (Authenticated)

#### 1. Create/Update Rating

```http
POST /ratings/songs/:songId
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": "Like"
}
```

**Response:**

```json
{
  "userId": 123,
  "songId": 456,
  "rating": "Like",
  "ratedAt": "2024-03-20T10:30:00Z",
  "updatedAt": "2024-03-20T10:30:00Z",
  "song": {
    "id": 456,
    "title": "Bohemian Rhapsody",
    "duration": 354,
    "artist": "Queen",
    "album": {
      "id": 78,
      "title": "A Night at the Opera",
      "coverImageUrl": "https://..."
    }
  }
}
```

#### 2. Delete Rating

```http
DELETE /ratings/songs/:songId
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Rating deleted successfully"
}
```

#### 3. Get User's Rating for a Song

```http
GET /ratings/songs/:songId/me
Authorization: Bearer <token>
```

**Response:** Same as Create/Update or `null` if not rated

#### 4. Get All User's Ratings

```http
GET /ratings/me?page=1&limit=20&rating=Like&sortBy=ratedAt&order=desc
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `rating` (string, optional): Filter by "Like" or "Dislike"
- `sortBy` (string, default: "ratedAt"): Sort by "ratedAt" or "songTitle"
- `order` (string, default: "desc"): "asc" or "desc"

**Response:**

```json
{
  "data": [
    {
      "userId": 123,
      "songId": 456,
      "rating": "Like",
      "ratedAt": "2024-03-20T10:30:00Z",
      "updatedAt": "2024-03-20T10:30:00Z",
      "song": {
        "id": 456,
        "title": "Bohemian Rhapsody",
        "duration": 354,
        "artist": "Queen",
        "album": {...}
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### 5. Get Liked Songs Only

```http
GET /ratings/me/liked-songs?page=1&limit=20
Authorization: Bearer <token>
```

**Response:** Same structure as "Get All User's Ratings" but only liked songs

#### 6. Get User's Rating Statistics

```http
GET /ratings/me/stats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "totalRatings": 150,
  "totalLikes": 120,
  "totalDislikes": 30,
  "likePercentage": 80.0,
  "dislikePercentage": 20.0,
  "recentRatings": [
    {
      "songId": 456,
      "songTitle": "Bohemian Rhapsody",
      "artist": "Queen",
      "rating": "Like",
      "ratedAt": "2024-03-20T10:30:00Z"
    }
  ]
}
```

### Public Endpoints

#### 7. Get Song Rating Statistics

```http
GET /ratings/songs/:songId/stats
Authorization: Bearer <token> (optional)
```

**Response:**

```json
{
  "songId": 456,
  "totalRatings": 5000,
  "totalLikes": 4500,
  "totalDislikes": 500,
  "likePercentage": 90.0,
  "dislikePercentage": 10.0,
  "userRating": "Like" // Only if authenticated
}
```

## Use Cases

### 1. User Interface - Like/Dislike Buttons

Display rating buttons on song pages:

```typescript
// Frontend example
const { data: userRating } = await api.get(`/ratings/songs/${songId}/me`)
const { data: stats } = await api.get(`/ratings/songs/${songId}/stats`)

// Display: "90% of users liked this song"
// Show: Thumbs up (highlighted if userRating === 'Like')
```

### 2. Liked Songs Playlist

Create "Liked Songs" collection similar to Spotify:

```typescript
const { data } = await api.get('/ratings/me/liked-songs?page=1&limit=50')
// Display grid of liked songs with quick access
```

### 3. Recommendation Engine

Use rating data for personalization:

```sql
-- Find similar users based on rating patterns
SELECT u2.id, COUNT(*) as shared_likes
FROM UserSongRating u1
JOIN UserSongRating u2 ON u1.songId = u2.songId
WHERE u1.userId = 123
  AND u2.userId != 123
  AND u1.rating = 'Like'
  AND u2.rating = 'Like'
GROUP BY u2.id
ORDER BY shared_likes DESC
LIMIT 10
```

### 4. Trending Songs

Sort by like percentage for discovery:

```sql
-- Songs with high like ratio (min 100 ratings for credibility)
SELECT s.*,
       COUNT(*) FILTER (WHERE r.rating = 'Like') * 100.0 / COUNT(*) as like_percentage
FROM Song s
JOIN UserSongRating r ON s.id = r.songId
GROUP BY s.id
HAVING COUNT(*) >= 100
ORDER BY like_percentage DESC
LIMIT 50
```

### 5. User Preference Analysis

Identify favorite genres/artists:

```sql
-- Top genres based on user's liked songs
SELECT g.name, COUNT(*) as like_count
FROM UserSongRating r
JOIN Song s ON r.songId = s.id
JOIN Genre g ON s.genreId = g.id
WHERE r.userId = 123 AND r.rating = 'Like'
GROUP BY g.id
ORDER BY like_count DESC
```

## Validation Rules

1. **Song Existence**: Song must exist and be active before rating
2. **Rating Value**: Must be either "Like" or "Dislike"
3. **Upsert Logic**: POST creates or updates existing rating
4. **Automatic Timestamps**: `ratedAt` set on create, `updatedAt` on modify
5. **Cascade Delete**: Ratings deleted when user/song is deleted

## Error Responses

### Song Not Found (404)

```json
{
  "statusCode": 404,
  "message": "SONG_NOT_FOUND",
  "error": "Not Found"
}
```

### Invalid Rating Value (400)

```json
{
  "statusCode": 400,
  "message": "INVALID_RATING_VALUE",
  "error": "Bad Request"
}
```

### Unauthorized (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## Integration Examples

### Display Song with Rating Stats

```typescript
// Fetch song with rating statistics
const song = await songService.findById(songId)
const stats = await ratingService.getSongRatingStats(songId, userId)

return {
  ...song,
  ratingStats: stats,
}
```

### Search Songs with Popularity

```typescript
// Include rating stats in search results
const songs = await searchService.search(query)
const songsWithRatings = await Promise.all(
  songs.map(async (song) => ({
    ...song,
    stats: await ratingService.getSongRatingStats(song.id),
  })),
)
```

### User Profile - Rating Activity

```typescript
// Show user's rating history in profile
const userStats = await ratingService.getUserRatingStats(userId)
const recentRatings = await ratingService.getUserRatings(userId, {
  page: 1,
  limit: 10,
  sortBy: 'ratedAt',
  order: 'desc',
})
```

## Performance Considerations

1. **Indexes**: Composite primary key on (userId, songId) ensures fast lookups
2. **Aggregation**: Statistics calculated at query time (consider caching for popular songs)
3. **Pagination**: Always use pagination for user rating lists
4. **Song Relations**: Repository includes song/artist/album to prevent N+1 queries
5. **Caching Strategy**: Cache song stats for 5 minutes for high-traffic songs

## Future Enhancements

- **Batch Operations**: Rate multiple songs at once
- **Rating History**: Track rating changes over time
- **Social Features**: See what friends rated
- **Export Data**: Download user's rating history
- **Rating Analytics**: Visualize rating patterns over time
- **Recommendation API**: Suggest songs based on rating patterns
