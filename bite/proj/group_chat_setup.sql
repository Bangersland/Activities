-- Group Chat and Prescription Sharing Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for patients without accounts
  patient_contact TEXT, -- For patients without user accounts, store contact number
  patient_name TEXT, -- For patients without user accounts, store name
  role TEXT DEFAULT 'member', -- 'admin' or 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure either user_id or patient_contact is provided
  CONSTRAINT check_member_identity CHECK (
    (user_id IS NOT NULL) OR (patient_contact IS NOT NULL)
  )
);

-- Create unique constraints separately to handle NULLs properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_user_unique 
  ON public.group_members(group_id, user_id) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_contact_unique 
  ON public.group_members(group_id, patient_contact) 
  WHERE patient_contact IS NOT NULL;

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT, -- For staff sending messages
  sender_contact TEXT, -- For patients without user accounts
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'prescription', 'file'
  prescription_data JSONB, -- Store prescription details if message_type is 'prescription'
  file_url TEXT, -- URL to uploaded file if message_type is 'file'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create prescriptions table (for storing prescription details)
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  patient_contact TEXT NOT NULL,
  patient_name TEXT,
  prescription_text TEXT NOT NULL,
  medication_details JSONB, -- Store medication list, dosages, etc.
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Staff can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.groups;

CREATE POLICY "Users can view groups they are members of" ON public.groups
  FOR SELECT USING (
    -- User is a member via user_id
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    ) OR
    -- Patient is a member via contact number
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.patient_contact IN (
        SELECT patient_contact FROM public.appointments WHERE user_id = auth.uid()
      )
    ) OR
    -- Staff/Admin can view all groups
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Staff can create groups" ON public.groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Group creators can update their groups" ON public.groups
  FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for group_members
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can view group members of groups they belong to" ON public.group_members;

CREATE POLICY "Users can view group members of groups they belong to" ON public.group_members
  FOR SELECT USING (
    -- User viewing their own membership
    user_id = auth.uid() OR
    -- Patient viewing groups they're added to via contact
    patient_contact IN (
      SELECT patient_contact FROM public.appointments WHERE user_id = auth.uid()
    ) OR
    -- Staff/Admin can view all members (check via profiles to avoid recursion)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    ) OR
    -- Check if user is a member via groups table (checking created_by to avoid recursion)
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
  );

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Staff can add members to groups" ON public.group_members;

CREATE POLICY "Staff can add members to groups" ON public.group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policies for messages
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in groups they belong to" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to groups they belong to" ON public.messages;

CREATE POLICY "Users can view messages in groups they belong to" ON public.messages
  FOR SELECT USING (
    -- User is a member via user_id
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.user_id = auth.uid()
    ) OR
    -- Patient is a member via contact
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.patient_contact IN (
        SELECT patient_contact FROM public.appointments WHERE user_id = auth.uid()
      )
    ) OR
    -- Staff/Admin can view all messages
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Users can send messages to groups they belong to" ON public.messages
  FOR INSERT WITH CHECK (
    -- User is a member via user_id
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.user_id = auth.uid()
    ) OR
    -- Patient is a member via contact
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.patient_contact IN (
        SELECT patient_contact FROM public.appointments WHERE user_id = auth.uid()
      )
    ) OR
    -- Staff/Admin can send messages to any group
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policies for prescriptions
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view prescriptions in groups they belong to" ON public.prescriptions;
DROP POLICY IF EXISTS "Staff can create prescriptions" ON public.prescriptions;

CREATE POLICY "Users can view prescriptions in groups they belong to" ON public.prescriptions
  FOR SELECT USING (
    -- User is a member via user_id
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = prescriptions.group_id
      AND group_members.user_id = auth.uid()
    ) OR
    -- Patient viewing their own prescription
    prescriptions.patient_contact IN (
      SELECT patient_contact FROM public.appointments WHERE user_id = auth.uid()
    ) OR
    -- Staff/Admin can view all prescriptions
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Staff can create prescriptions" ON public.prescriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_patient_contact ON public.group_members(patient_contact);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_prescriptions_group_id ON public.prescriptions(group_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_contact ON public.prescriptions(patient_contact);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_groups_updated_at_trigger ON public.groups;
CREATE TRIGGER update_groups_updated_at_trigger
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION update_groups_updated_at();

