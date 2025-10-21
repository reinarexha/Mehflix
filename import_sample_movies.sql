-- IMPORT MOVIES DATA FROM CSV
-- Run this in Supabase SQL Editor to populate your movies table

-- First, let's check if the movies table exists and is empty
SELECT 'BEFORE IMPORT' as status, COUNT(*) as movie_count FROM movies;

-- Create movies table if it doesn't exist (adjust column types as needed)
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY,
  release_date DATE,
  title TEXT,
  overview TEXT,
  popularity DECIMAL,
  vote_count INTEGER,
  vote_average DECIMAL,
  original_language TEXT,
  genre TEXT,
  poster_url TEXT
);

-- If you need to clear existing data first (uncomment the line below)
-- DELETE FROM movies;

-- Insert sample data (you'll need to import the full CSV file)
-- This is just a sample - you'll need to import the full movies.csv file
INSERT INTO movies (id, release_date, title, overview, popularity, vote_count, vote_average, original_language, genre, poster_url) VALUES
(1, '2021-12-15', 'Spider-Man: No Way Home', 'Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous, forcing him to discover what it truly means to be Spider-Man.', 5083.954, 8940, 8.3, 'en', 'Action, Adventure, Science Fiction', 'https://image.tmdb.org/t/p/original/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg'),
(2, '2022-03-01', 'The Batman', 'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.', 3827.658, 1151, 8.1, 'en', 'Crime, Mystery, Thriller', 'https://image.tmdb.org/t/p/original/74xTEgt7R36Fpooo50r9T25onhq.jpg'),
(3, '2022-02-25', 'No Exit', 'Stranded at a rest stop in the mountains during a blizzard, a recovering addict discovers a kidnapped child hidden in a car belonging to one of the people inside the building which sets her on a terrifying struggle to identify who among them is the kidnapper.', 2618.087, 122, 6.3, 'en', 'Thriller', 'https://image.tmdb.org/t/p/original/vDHsLnOWKlPGmWs0kGfuhNF4w5l.jpg'),
(4, '2021-11-24', 'Encanto', 'The tale of an extraordinary family, the Madrigals, who live hidden in the mountains of Colombia, in a magical house, in a vibrant town, in a wondrous, charmed place called an Encanto. The magic of the Encanto has blessed every child in the family with a unique gift from super strength to the power to heal—every child except one, Mirabel. But when she discovers that the magic surrounding the Encanto is in danger, Mirabel decides that she, the only ordinary Madrigal, might just be her exceptional family''s last hope.', 2402.201, 5076, 7.7, 'en', 'Animation, Comedy, Family, Fantasy', 'https://image.tmdb.org/t/p/original/4j0PNHkMr5ax3IA8tjtxcmPU3QT.jpg'),
(5, '2021-12-22', 'The King''s Man', 'As a collection of history''s worst tyrants and criminal masterminds gather to plot a war to wipe out millions, one man must race against time to stop them.', 1895.511, 1793, 7.0, 'en', 'Action, Adventure, Thriller, War', 'https://image.tmdb.org/t/p/original/aq4Pwv5Xeuvj6HZKtxyd23e6bE9.jpg');

-- Check after import
SELECT 'AFTER IMPORT' as status, COUNT(*) as movie_count FROM movies;

-- Show sample imported data
SELECT id, title, release_date, genre FROM movies ORDER BY id LIMIT 5;
