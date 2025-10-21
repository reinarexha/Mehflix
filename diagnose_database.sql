-- Quick database diagnosis
-- Run this in Supabase SQL Editor to see what's in your database

-- 1. Check if movies table exists and has data
SELECT 'MOVIES TABLE' as table_name, COUNT(*) as total_rows FROM movies;

-- 2. Check if trailers table exists and has data  
SELECT 'TRAILERS TABLE' as table_name, COUNT(*) as total_rows FROM trailers;

-- 3. Show first few movies
SELECT 'SAMPLE MOVIES' as info, id, title, release_date 
FROM movies 
ORDER BY id 
LIMIT 3;

-- 4. Show first few trailers
SELECT 'SAMPLE TRAILERS' as info, id, youtube_id 
FROM trailers 
ORDER BY id 
LIMIT 3;

-- 5. Check table structure
SELECT 'MOVIES COLUMNS' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'movies' 
ORDER BY ordinal_position;

-- 6. Check if there are any movies without trailers
SELECT 'MOVIES WITHOUT TRAILERS' as info, COUNT(*) as count
FROM movies m
LEFT JOIN trailers t ON m.id::text = t.id::text
WHERE t.id IS NULL;
