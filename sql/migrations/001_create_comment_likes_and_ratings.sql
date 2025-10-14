-- sql/migrations/001_create_comment_likes_and_ratings.sql
-- Run this SQL in your Supabase SQL editor (or psql) to create comment_likes and ratings tables.

-- Create comment_likes table: tracks which user liked which comment
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comment_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Optional: add FKs if your setup uses the standard tables
ALTER TABLE IF EXISTS public.comment_likes
  ADD CONSTRAINT fk_comment_likes_user
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- If you have a comments table with uuid id
ALTER TABLE IF EXISTS public.comment_likes
  ADD CONSTRAINT fk_comment_likes_comment
    FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create ratings table: store per-user rating + optional comment
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trailer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 0 AND rating <= 10),
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE IF EXISTS public.ratings
  ADD CONSTRAINT fk_ratings_user
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.ratings
  ADD CONSTRAINT fk_ratings_trailer
    FOREIGN KEY (trailer_id) REFERENCES public.trailers(id) ON DELETE CASCADE;

-- Example seed data (uncomment to run):
-- INSERT INTO public.ratings (user_id, trailer_id, rating, comment) VALUES
--   ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 8, 'Great!');
--
-- INSERT INTO public.comment_likes (user_id, comment_id) VALUES
--   ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011');
