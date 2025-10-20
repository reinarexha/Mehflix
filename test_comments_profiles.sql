-- Quick test to verify profiles and comments are properly linked
-- Run this in Supabase SQL Editor to see the actual data

-- Show all comments with their associated username data
SELECT 
    c.id as comment_id,
    c.content,
    c.user_id,
    c.trailer_id,
    p.username as profile_username,
    p.email as profile_email,
    au.email as auth_email,
    COALESCE(p.username, p.email, au.email, 'User_' || SUBSTRING(c.user_id::text, 1, 8)) as final_display_name
FROM public.comments c
LEFT JOIN public.profiles p ON c.user_id = p.id  
LEFT JOIN auth.users au ON c.user_id = au.id
ORDER BY c.created_at DESC;

-- Also check if the profiles table has data
SELECT 
    id,
    username,
    email,
    created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 5;