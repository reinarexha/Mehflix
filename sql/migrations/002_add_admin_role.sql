-- Add admin role to profiles table
-- Run this in your Supabase SQL Editor

-- Add is_admin column to profiles table (defaults to false)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Optional: Set specific users as admins (replace with your admin user IDs)
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your-admin@email.com';

-- Create an RLS policy to allow users to read admin status
DROP POLICY IF EXISTS "Allow reading admin status" ON public.profiles;
CREATE POLICY "Allow reading admin status"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Prevent non-admins from updating admin status (only admins can set other users as admin)
DROP POLICY IF EXISTS "Admins can update admin status" ON public.profiles;
CREATE POLICY "Admins can update admin status"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  -- Either updating your own non-admin fields OR you're an admin updating admin status
  (auth.uid() = id AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = false)
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (auth.uid() = id AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = false)
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Example: Set the first user as admin (uncomment and modify)
-- UPDATE public.profiles SET is_admin = true WHERE email = 'admin@example.com';

