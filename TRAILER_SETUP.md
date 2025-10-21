# YouTube Trailer Integration Setup

## Quick Start (Recommended: TMDb)

### 1. Get TMDb API Key (FREE)
1. Go to https://www.themoviedb.org/settings/api
2. Create a free account if you don't have one
3. Request an API key (instant approval)
4. Copy your API key

### 2. Add to Environment
Create/update `.env.local` in your project root:
```
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

### 3. Test the System
1. Start your development server: `npm run dev`
2. Go to `/trailer-management` in your app
3. Select "TMDb (Recommended)"
4. Click "Update 10 Movies" to test

### 4. Scale to All Movies
- TMDb allows 40 requests per 10 seconds
- You can process ~14,400 movies per hour
- For 10,000 movies: about 45 minutes total

## Alternative: YouTube Search API

### Setup YouTube API (More Complex)
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add to `.env.local`:
```
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
```

### YouTube Limitations
- 10,000 quota units per day (~1,000 searches)  
- Less accurate results (searches can be wrong)
- Slower processing due to strict rate limits
- For 10,000 movies: would take 10+ days

## Database Schema

Your `trailers` table should have:
```sql
CREATE TABLE trailers (
  id VARCHAR PRIMARY KEY,        -- Movie ID as string
  title VARCHAR NOT NULL,        -- Movie title
  youtube_id VARCHAR NOT NULL,   -- YouTube video ID
  category VARCHAR DEFAULT 'Movie',
  poster_url VARCHAR DEFAULT ''
);
```

## Processing Strategy

### For 10,000+ Movies:
1. **Start with TMDb** - more reliable and faster
2. **Process in batches** - 100-500 movies at a time
3. **Monitor success rate** - TMDb typically 70-80% success
4. **Handle failures** - retry failed movies with YouTube API
5. **Run during off-hours** - minimize user impact

### Batch Processing Example:
```typescript
// Process movies 1-1000
await TMDbTrailerService.updateAllMovies('movies', 1000);

// Process upcoming movies
await TMDbTrailerService.updateAllMovies('upcoming_movies', 500);

// Process new releases  
await TMDbTrailerService.updateAllMovies('new_releases', 200);
```

## Troubleshooting

### Common Issues:
1. **"Movie not found"** - Title doesn't match TMDb exactly
2. **"No trailer found"** - Movie doesn't have trailers available
3. **API errors** - Check your API key and rate limits

### Success Rate Expectations:
- **TMDb**: 70-80% success rate
- **YouTube**: 50-60% success rate
- **Combined**: 85-90% success rate

### Performance Tips:
- Process older movies first (more likely to have trailers)
- Skip animated movies if low priority (fewer trailers)
- Use year filtering for better matches
- Monitor API quotas and usage

## Cost Analysis

### TMDb (FREE)
- ✅ Free forever
- ✅ 40 requests per 10 seconds
- ✅ Official trailer data
- ✅ 10,000 movies in ~1 hour

### YouTube API
- ❌ Complex quota system
- ❌ 1,000 searches per day limit  
- ❌ $0.05 per 1,000 additional queries
- ❌ 10,000 movies takes 10+ days

## Recommendation

**Use TMDb for your 10,000+ movies.** It's faster, more accurate, free, and will give you better results with less complexity.