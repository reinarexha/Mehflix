-- Simple test to see your data
-- Run each query separately

-- 1. Check movies table IDs
SELECT id, title FROM movies ORDER BY id LIMIT 5;

-- 2. Check trailers table IDs and YouTube data  
SELECT id, name, youtube_key, youtube_url FROM trailers ORDER BY id LIMIT 5;

-- 3. Check if IDs match
SELECT COUNT(*) as matching_ids 
FROM movies m 
INNER JOIN trailers t ON m.id = t.id;