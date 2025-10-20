-- SQL Commands to fix ALL existing comments to show usernames instead of IDs
-- Run this in your Supabase SQL Editor

-- 1. First, ensure ALL users have profiles (comprehensive backfill)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Create profiles for any users that still don't have them
    FOR user_record IN 
        SELECT au.id, au.email, au.created_at, au.updated_at, au.raw_user_meta_data
        FROM auth.users au
        WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
    LOOP
        INSERT INTO public.profiles (id, username, email, created_at, updated_at)
        VALUES (
            user_record.id,
            COALESCE(
                user_record.raw_user_meta_data->>'username',
                user_record.email,
                'User_' || SUBSTRING(user_record.id::text, 1, 8)
            ),
            user_record.email,
            user_record.created_at,
            user_record.updated_at
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created profile for user: %', user_record.email;
    END LOOP;
END $$;

-- 2. Update any profiles that have NULL usernames
UPDATE public.profiles 
SET username = COALESCE(
    email,
    'User_' || SUBSTRING(id::text, 1, 8)
)
WHERE username IS NULL OR username = '';

-- 3. Force refresh all comments data to trigger proper username loading
-- This updates the updated_at timestamp which will cause the frontend to reload
UPDATE public.comments 
SET updated_at = NOW()
WHERE TRUE;

-- 4. Verify the fix - Show a sample of comments with usernames
SELECT 
    c.id,
    c.content,
    c.user_id,
    COALESCE(p.username, au.email, 'Unknown User') as display_name,
    c.created_at
FROM public.comments c
LEFT JOIN public.profiles p ON c.user_id = p.id
LEFT JOIN auth.users au ON c.user_id = au.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 5. Show count of comments that now have proper username mapping
SELECT 
    COUNT(*) as total_comments,
    COUNT(p.username) as comments_with_profiles,
    COUNT(au.email) as comments_with_users
FROM public.comments c
LEFT JOIN public.profiles p ON c.user_id = p.id
LEFT JOIN auth.users au ON c.user_id = au.id;