-- SQL Commands to create notifications system for comment likes
-- Run this in your Supabase SQL Editor

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('comment_like', 'comment_reply', 'follow')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create comment_likes table to track who liked what
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(comment_id, user_id) -- Prevent duplicate likes
);

-- 3. Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow inserting notifications
DROP POLICY IF EXISTS "Allow notification creation" ON public.notifications;
CREATE POLICY "Allow notification creation"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Enable RLS on comment_likes table
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all comment likes (to see like counts)
DROP POLICY IF EXISTS "Allow viewing comment likes" ON public.comment_likes;
CREATE POLICY "Allow viewing comment likes"
ON public.comment_likes FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can insert/delete their own likes
DROP POLICY IF EXISTS "Users can manage own likes" ON public.comment_likes;
CREATE POLICY "Users can manage own likes"
ON public.comment_likes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Create function to create notification when someone likes a comment
CREATE OR REPLACE FUNCTION create_comment_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  comment_author_id uuid;
  liker_username text;
  comment_content text;
BEGIN
  -- Get the comment author and content
  SELECT user_id, content INTO comment_author_id, comment_content
  FROM public.comments 
  WHERE id = NEW.comment_id;
  
  -- Don't create notification if user liked their own comment
  IF comment_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the liker's username
  SELECT COALESCE(p.username, p.email, 'Someone') INTO liker_username
  FROM public.profiles p
  WHERE p.id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    comment_author_id,
    'comment_like',
    'Comment Liked',
    liker_username || ' liked your comment: "' || LEFT(comment_content, 50) || 
    CASE WHEN LENGTH(comment_content) > 50 THEN '..."' ELSE '"' END,
    jsonb_build_object(
      'comment_id', NEW.comment_id,
      'liker_id', NEW.user_id,
      'liker_username', liker_username
    )
  );
  
  RETURN NEW;
END;
$$;

-- 6. Create trigger for comment like notifications
DROP TRIGGER IF EXISTS comment_like_notification_trigger ON public.comment_likes;
CREATE TRIGGER comment_like_notification_trigger
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_like_notification();

-- 7. Create function to clean up old notifications (optional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete notifications older than 30 days
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;