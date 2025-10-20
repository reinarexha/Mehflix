-- SQL Commands to fix username display in comments
-- Run these in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- 1. First, let's create a trigger function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.email),
    new.email,
    new.created_at,
    new.updated_at
  );
  RETURN new;
END;
$$;

-- 2. Create the trigger that fires when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create profiles for existing users who don't have them yet
INSERT INTO public.profiles (id, username, email, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', au.email, 'User_' || SUBSTRING(au.id::text, 1, 8)) as username,
  au.email,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- 4. Set up Row Level Security (RLS) policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all profiles (for displaying usernames in comments)
DROP POLICY IF EXISTS "Allow read access to all profiles" ON public.profiles;
CREATE POLICY "Allow read access to all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Allow profile creation (for the trigger)
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
CREATE POLICY "Allow profile creation"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Update existing comments to ensure they have proper profile references
-- This will help display usernames for existing comments
UPDATE public.comments 
SET updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE id NOT IN (SELECT id FROM public.profiles)
);

-- 6. Optional: Add a function to get username with fallback
CREATE OR REPLACE FUNCTION public.get_username(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  SELECT COALESCE(p.username, au.email, 'User_' || SUBSTRING(user_id::text, 1, 8))
  INTO result
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE au.id = user_id;
  
  RETURN COALESCE(result, 'Unknown User');
END;
$$;