-- COMPREHENSIVE DATABASE DIAGNOSIS
-- Run this in Supabase SQL Editor to identify the exact issue

-- 1. Check if tables exist and their row counts
SELECT 
  'movies' as table_name, 
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) = 0 THEN 'EMPTY TABLE' ELSE 'HAS DATA' END as status
FROM movies
UNION ALL
SELECT 
  'trailers' as table_name, 
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) = 0 THEN 'EMPTY TABLE' ELSE 'HAS DATA' END as status
FROM trailers
UNION ALL
SELECT 
  'upcoming_movies' as table_name, 
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) = 0 THEN 'EMPTY TABLE' ELSE 'HAS DATA' END as status
FROM upcoming_movies
UNION ALL
SELECT 
  'new_releases' as table_name, 
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) = 0 THEN 'EMPTY TABLE' ELSE 'HAS DATA' END as status
FROM new_releases;

-- 2. Check movies table structure
SELECT 'MOVIES TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'movies' 
ORDER BY ordinal_position;

-- 3. Check trailers table structure  
SELECT 'TRAILERS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trailers' 
ORDER BY ordinal_position;

-- 4. If movies table has data, show sample
SELECT 'SAMPLE MOVIES DATA' as info;
SELECT id, title, release_date, poster_url 
FROM movies 
ORDER BY id 
LIMIT 5;

-- 5. Check for any foreign key relationships
SELECT 'FOREIGN KEY RELATIONSHIPS' as info;
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'movies' OR tc.table_name = 'trailers');
