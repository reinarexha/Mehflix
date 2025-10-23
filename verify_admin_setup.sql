-- VERIFICATION SCRIPT FOR ADMIN SETUP
-- Run this in Supabase SQL Editor to check if everything is configured correctly

-- Step 1: Check if is_admin column exists in profiles table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'is_admin';
-- Expected: Should return 1 row showing is_admin column exists
-- If NO ROWS: You need to run the migration from 002_add_admin_role.sql

-- Step 2: Show all users in profiles table with their admin status
SELECT 
  id,
  email,
  username,
  is_admin,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
-- Expected: Shows all users. Check if YOUR email has is_admin = true
-- If is_admin is NULL or false for your account, you need to run the UPDATE command below

-- Step 3: Check if there are any admins
SELECT 
  email,
  username,
  is_admin
FROM public.profiles
WHERE is_admin = true;
-- Expected: Should show at least 1 row (your admin account)
-- If NO ROWS: No admins are set. Run the command below to make yourself admin

-- Step 4: If you need to set yourself as admin, run this:
-- REPLACE 'your-email@example.com' with your actual email from Step 2
/*
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
*/

-- Step 5: Verify the update worked
SELECT 
  email,
  username,
  is_admin
FROM public.profiles
WHERE email = 'your-email@example.com';
-- Expected: is_admin should be true

-- Step 6: Check auth.users to find your actual email if you're not sure
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.is_admin
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;
-- This shows users from auth.users joined with their profile data
-- Find your email and check if is_admin is true

