-- Staff Details Table Setup for Supabase
-- Run this in your Supabase SQL Editor

-- Create staff_details table
CREATE TABLE IF NOT EXISTS public.staff_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sex TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  contact_number TEXT NOT NULL,
  address TEXT NOT NULL,
  job_position TEXT NOT NULL,
  date_hired DATE NOT NULL,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.staff_details ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_details table
CREATE POLICY "Users can view their own staff details" ON public.staff_details
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own staff details" ON public.staff_details
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all staff details" ON public.staff_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can insert staff details" ON public.staff_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update staff details" ON public.staff_details
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_details_user_id ON public.staff_details(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_details_job_position ON public.staff_details(job_position);
CREATE INDEX IF NOT EXISTS idx_staff_details_status ON public.staff_details(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_staff_details_updated_at_trigger ON public.staff_details;
CREATE TRIGGER update_staff_details_updated_at_trigger
  BEFORE UPDATE ON public.staff_details
  FOR EACH ROW EXECUTE FUNCTION update_staff_details_updated_at();

-- Create function to get staff details with profile info
CREATE OR REPLACE FUNCTION get_staff_with_profile(staff_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  sex TEXT,
  date_of_birth DATE,
  contact_number TEXT,
  address TEXT,
  job_position TEXT,
  date_hired DATE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.username,
    p.email,
    p.first_name,
    p.last_name,
    sd.sex,
    sd.date_of_birth,
    sd.contact_number,
    sd.address,
    sd.job_position,
    sd.date_hired,
    sd.status,
    sd.created_at
  FROM public.profiles p
  LEFT JOIN public.staff_details sd ON p.id = sd.user_id
  WHERE p.id = staff_user_id AND p.role = 'staff';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.staff_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_staff_with_profile(UUID) TO authenticated;

-- Verify the table was created successfully
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'staff_details' 
ORDER BY ordinal_position; 