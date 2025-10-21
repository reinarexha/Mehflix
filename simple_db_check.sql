-- SIMPLE DATABASE CHECK
-- Run this in Supabase SQL Editor to see what's in your database

-- 1. Check if movies table exists and has data
SELECT 'MOVIES TABLE CHECK' as test;
SELECT COUNT(*) as total_movies FROM movies;

-- 2. Show first 3 movies if any exist
SELECT 'SAMPLE MOVIES' as test;
SELECT id, title, release_date FROM movies ORDER BY id LIMIT 3;

-- 3. Check trailers table
SELECT 'TRAILERS TABLE CHECK' as test;
SELECT COUNT(*) as total_trailers FROM trailers;

-- 4. Check upcoming_movies table
SELECT 'UPCOMING MOVIES CHECK' as test;
SELECT COUNT(*) as total_upcoming FROM upcoming_movies;

-- 5. Check new_releases table
SELECT 'NEW RELEASES CHECK' as test;
SELECT COUNT(*) as total_new_releases FROM new_releases;

-- 6. Check table structure
SELECT 'MOVIES TABLE STRUCTURE' as test;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'movies' 
ORDER BY ordinal_position;
