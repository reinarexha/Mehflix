-- Copy YouTube URLs from trailers table to movies table
-- Run this in Supabase SQL Editor

-- Add youtube_id column to movies table (if it doesn't exist)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS youtube_id TEXT;

-- Copy YouTube URLs from trailers to movies where IDs match
-- Try youtube_url first, if that fails try youtube_key
UPDATE movies 
SET youtube_id = COALESCE(trailers.youtube_url, trailers.youtube_key)
FROM trailers 
WHERE movies.id = trailers.id::bigint;

-- Check how many were updated
SELECT 
  COUNT(*) as total_movies,
  COUNT(youtube_id) as movies_with_trailers,
  COUNT(*) - COUNT(youtube_id) as movies_without_trailers
FROM movies;

-- Show sample results
SELECT id, title, youtube_id 
FROM movies 
WHERE youtube_id IS NOT NULL 
LIMIT 10;