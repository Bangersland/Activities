-- Fix Group Chat RLS Policies - Infinite Recursion Issue
-- Run this in your Supabase SQL Editor if you're getting recursion errors

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Staff can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view group members of groups they belong to" ON public.group_members;
DROP POLICY IF EXISTS "Staff can add members to groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can view messages in groups they belong to" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to groups they belong to" ON public.messages;
DROP POLICY IF EXISTS "Users can view prescriptions in groups they belong to" ON public.prescriptions;
DROP POLICY IF EXISTS "Staff can create prescriptions" ON public.prescriptions;

-- Fix group_members table if user_id is NOT NULL
DO $$
BEGIN
  -- Make user_id nullable if it's not already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'group_members' 
    AND column_name = 'user_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.group_members ALTER COLUMN user_id DROP NOT NULL;
  END IF;
  
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_member_identity' 
    AND table_name = 'group_members'
  ) THEN
    ALTER TABLE public.group_members 
    ADD CONSTRAINT check_member_identity CHECK (
      (user_id IS NOT NULL) OR (patient_contact IS NOT NULL)
    );
  END IF;
END $$;

-- Drop old unique constraints if they exist
DROP INDEX IF EXISTS idx_group_members_user_unique;
DROP INDEX IF EXISTS idx_group_members_contact_unique;

-- Create new unique indexes that handle NULLs properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_user_unique 
  ON public.group_members(group_id, user_id) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_contact_unique 
  ON public.group_members(group_id, patient_contact) 
  WHERE patient_contact IS NOT NULL;

-- Recreate RLS Policies for groups (without recursion)
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

-- Recreate RLS Policies for group_members (FIXED - no recursion)
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
    -- Check if user created the group (via groups table to avoid recursion)
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
  );

CREATE POLICY "Staff can add members to groups" ON public.group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Recreate RLS Policies for messages
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

-- Recreate RLS Policies for prescriptions
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

