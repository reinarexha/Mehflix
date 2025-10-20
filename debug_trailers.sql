-- Debug script to see why no trailers were copied
-- Run this in Supabase SQL Editor

-- 1a. Check sample IDs from MOVIES table
SELECT 'MOVIES TABLE' as source, id, title 
FROM movies 
ORDER BY id 
LIMIT 5;

-- 1b. Check sample IDs from TRAILERS table  
SELECT 'TRAILERS TABLE' as source, id, site 
FROM trailers 
ORDER BY id 
LIMIT 5;

-- 2. Check if there are any matching IDs
SELECT 
  COUNT(*) as matching_ids
FROM movies m
INNER JOIN trailers t ON m.id = t.id::bigint;

-- 3. Show trailers table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trailers' 
ORDER BY ordinal_position;

-- 4. Show sample trailer data
SELECT id, site, 
  CASE 
    WHEN youtube_url IS NOT NULL THEN youtube_url
    WHEN youtube_key IS NOT NULL THEN youtube_key  
    ELSE 'NO_YOUTUBE_DATA'
  END as youtube_data
FROM trailers 
LIMIT 5;