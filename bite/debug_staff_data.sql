-- Debug Staff Data Queries
-- Run these in your Supabase SQL Editor to check your data

-- 1. Check if staff_details table exists and has data
SELECT 
  COUNT(*) as total_staff,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
  COUNT(CASE WHEN job_position IS NOT NULL THEN 1 END) as with_position
FROM staff_details;

-- 2. Check if profiles table exists and has data
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff_profiles,
  COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as with_username
FROM profiles;

-- 3. Check the actual data in staff_details
SELECT 
  id,
  user_id,
  sex,
  date_of_birth,
  contact_number,
  address,
  job_position,
  date_hired,
  status,
  created_at,
  updated_at
FROM staff_details
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check the actual data in profiles
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
FROM profiles
WHERE role = 'staff'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check the joined data (this is what the component should see)
SELECT 
  sd.id,
  sd.user_id,
  sd.sex,
  sd.date_of_birth,
  sd.contact_number,
  sd.address,
  sd.job_position,
  sd.date_hired,
  sd.status,
  p.username,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  p.profile_image
FROM staff_details sd
LEFT JOIN profiles p ON sd.user_id = p.id
ORDER BY sd.created_at DESC
LIMIT 5;

-- 6. Check RLS policies on staff_details
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'staff_details';

-- 7. Check RLS policies on profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('staff_details', 'profiles'); 