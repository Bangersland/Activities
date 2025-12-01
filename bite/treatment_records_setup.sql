-- Create treatment_records table to store all patient and treatment information
CREATE TABLE IF NOT EXISTS public.treatment_records (
  id SERIAL PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  
  -- Patient Information
  user_id UUID REFERENCES auth.users(id), -- Link to patient's user account
  patient_name TEXT,
  patient_contact TEXT,
  patient_address TEXT,
  patient_age INTEGER,
  patient_sex TEXT,
  appointment_date DATE,
  
  -- Bite Information
  date_bitten DATE,
  time_bitten TIME,
  site_of_bite TEXT,
  biting_animal TEXT,
  animal_status TEXT,
  place_bitten_barangay TEXT,
  provoked TEXT,
  local_wound_treatment TEXT,
  
  -- Treatment Details
  type_of_exposure TEXT,
  category_of_exposure JSONB, -- Store checkbox selections as JSON
  vaccine_brand_name TEXT,
  treatment_to_be_given JSONB, -- Store checkbox selections as JSON
  route TEXT,
  rig TEXT,
  d0_date DATE,
  d3_date DATE,
  d7_date DATE,
  d14_date DATE,
  d28_30_date DATE,
  status_of_animal_date DATE,
  remarks TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.treatment_records ENABLE ROW LEVEL SECURITY;

-- Create policies for treatment_records
CREATE POLICY "Staff can view all treatment records" ON public.treatment_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Staff can insert treatment records" ON public.treatment_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Staff can update treatment records" ON public.treatment_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Policy for patients to view their own treatment records
-- Primary method: Direct user ID match (most secure)
-- Fallback method: Contact matching for non-authenticated access
CREATE POLICY "Patients can view their own treatment records" ON public.treatment_records
  FOR SELECT USING (
    -- Primary: Direct user ID match (for authenticated patients)
    user_id = auth.uid() OR
    -- Fallback: Allow access if the patient's contact matches
    patient_contact = (auth.jwt() ->> 'phone') OR
    -- Or if they provide contact in a custom claim
    patient_contact = (auth.jwt() -> 'user_metadata' ->> 'contact')
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_treatment_records_appointment_id ON public.treatment_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_created_at ON public.treatment_records(created_at);
CREATE INDEX IF NOT EXISTS idx_treatment_records_user_id ON public.treatment_records(user_id);
