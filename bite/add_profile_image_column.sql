-- Add profile_image column to staff_details table
-- Run this in your Supabase SQL Editor

-- Add profile_image column to staff_details table if it doesn't exist
ALTER TABLE public.staff_details 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Create index for profile_image in staff_details table
CREATE INDEX IF NOT EXISTS idx_staff_details_profile_image ON public.staff_details(profile_image);

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'staff_details' 
AND column_name = 'profile_image';

-- Check if there are any existing staff records with profile images
SELECT 
  user_id,
  profile_image
FROM public.staff_details 
WHERE profile_image IS NOT NULL; 