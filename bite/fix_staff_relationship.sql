-- Fix Staff Details and Profiles Relationship
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current state of both tables
SELECT 'staff_details table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'staff_details' 
ORDER BY ordinal_position;

SELECT 'profiles table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Check if foreign key constraint exists
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='staff_details';

-- 3. Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    -- Check if the foreign key already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'staff_details_user_id_fkey' 
        AND table_name = 'staff_details'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.staff_details 
        ADD CONSTRAINT staff_details_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- 4. Update RLS policies to allow proper access
-- Drop existing policies if they're too restrictive
DROP POLICY IF EXISTS "Users can view their own staff details" ON public.staff_details;
DROP POLICY IF EXISTS "Users can update their own staff details" ON public.staff_details;
DROP POLICY IF EXISTS "Admins can view all staff details" ON public.staff_details;
DROP POLICY IF EXISTS "Admins can insert staff details" ON public.staff_details;
DROP POLICY IF EXISTS "Admins can update staff details" ON public.staff_details;

-- Create more permissive policies for debugging
CREATE POLICY "Allow authenticated users to view all staff details" ON public.staff_details
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert staff details" ON public.staff_details
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update staff details" ON public.staff_details
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Also update profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Allow authenticated users to view all profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update profiles" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Test the relationship
SELECT 
    sd.id as staff_id,
    sd.user_id,
    sd.job_position,
    p.id as profile_id,
    p.username,
    p.email,
    p.first_name,
    p.last_name
FROM staff_details sd
LEFT JOIN profiles p ON sd.user_id = p.id
ORDER BY sd.created_at DESC
LIMIT 5;

-- 7. Check if there are any orphaned records
SELECT 
    'Orphaned staff_details records (no matching profile):' as info,
    COUNT(*) as count
FROM staff_details sd
LEFT JOIN profiles p ON sd.user_id = p.id
WHERE p.id IS NULL;

SELECT 
    'Orphaned profiles records (no matching staff_details):' as info,
    COUNT(*) as count
FROM profiles p
LEFT JOIN staff_details sd ON p.id = sd.user_id
WHERE sd.id IS NULL AND p.role = 'staff';

-- 8. Show current data counts
SELECT 
    'staff_details count:' as table_name,
    COUNT(*) as record_count
FROM staff_details
UNION ALL
SELECT 
    'profiles with role=staff count:' as table_name,
    COUNT(*) as record_count
FROM profiles WHERE role = 'staff'; 