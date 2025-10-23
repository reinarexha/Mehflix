# Admin Setup Guide

This guide explains how to set up admin users who can edit and delete their own comments in Mehflix.

## Overview

Only users with admin status can edit and delete comments. Regular users will not see edit/delete buttons even on their own comments.

## Setup Steps

### 1. Run the Database Migration

First, run the SQL migration to add the `is_admin` field to the profiles table:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `sql/migrations/002_add_admin_role.sql`
4. Copy and paste the contents into the SQL Editor
5. Click **Run**

### 2. Set Users as Admins

After running the migration, you need to manually set which users should be admins.

#### Option A: Set admin by email

```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'your-admin@email.com';
```

#### Option B: Set admin by user ID

```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE id = 'your-user-id-uuid-here';
```

#### Option C: Check current users and set admin

```sql
-- First, see all users
SELECT id, email, username, is_admin 
FROM public.profiles 
ORDER BY created_at DESC;

-- Then update the one you want
UPDATE public.profiles 
SET is_admin = true 
WHERE id = 'the-id-from-above';
```

### 3. Verify Admin Status

To check which users are admins:

```sql
SELECT id, email, username, is_admin 
FROM public.profiles 
WHERE is_admin = true;
```

## How It Works

### Frontend Behavior

- **Admin users who own a comment**: See Edit and Delete buttons
- **Admin users on other users' comments**: No Edit/Delete buttons
- **Regular users**: Never see Edit/Delete buttons, even on their own comments
- **All users**: Can still Like any comment

### Database Security

The migration includes Row Level Security (RLS) policies that:
- Allow all authenticated users to read admin status (needed to show/hide UI elements)
- Prevent non-admins from setting themselves as admin
- Allow admins to modify admin status for any user

## Making Someone an Admin

### From SQL Editor

```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'newadmin@example.com';
```

### Removing Admin Status

```sql
UPDATE public.profiles 
SET is_admin = false 
WHERE email = 'former-admin@example.com';
```

## Troubleshooting

### Edit/Delete buttons not showing for admin

1. Verify the user is set as admin:
   ```sql
   SELECT email, is_admin FROM public.profiles WHERE email = 'your-email@example.com';
   ```

2. Make sure the user owns the comment (comments can only be edited/deleted by their author)

3. Clear browser cache and refresh the page

### Cannot update is_admin field

Make sure you:
1. Ran the migration script completely
2. Are executing the UPDATE command in Supabase SQL Editor (not from the app)
3. Have proper database permissions

## Security Note

Only set trusted users as admins. Admins can:
- Edit and delete their own comments
- (Future feature) Potentially have other elevated permissions

Regular comment operations (create, like) don't require admin status.

