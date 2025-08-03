-- Storage Setup for Staff Photos
-- Run this in your Supabase SQL Editor

-- Create storage bucket for staff photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-photos',
  'staff-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for staff photos
CREATE POLICY "Staff photos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'staff-photos');

-- Create policy for authenticated users to upload staff photos
CREATE POLICY "Authenticated users can upload staff photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'staff-photos' 
    AND auth.role() = 'authenticated'
  );

-- Create policy for users to update their own photos
CREATE POLICY "Users can update their own staff photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'staff-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for users to delete their own photos
CREATE POLICY "Users can delete their own staff photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'staff-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add profile_image column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add profile_image column to staff_details table if it doesn't exist
ALTER TABLE public.staff_details 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Create index for profile_image in profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_profile_image ON public.profiles(profile_image);

-- Create index for profile_image in staff_details table
CREATE INDEX IF NOT EXISTS idx_staff_details_profile_image ON public.staff_details(profile_image);

-- Verify storage bucket was created
SELECT * FROM storage.buckets WHERE id = 'staff-photos'; 