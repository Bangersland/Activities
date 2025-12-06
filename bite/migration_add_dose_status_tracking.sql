-- Migration: Add dose status tracking to treatment_records table
-- This adds status, updated_by, and updated_at columns for each dose (d0, d3, d7, d14, d28_30)

-- Add status columns for each dose
ALTER TABLE public.treatment_records
ADD COLUMN IF NOT EXISTS d0_status VARCHAR(20) DEFAULT 'pending' CHECK (d0_status IN ('pending', 'completed', 'missed')),
ADD COLUMN IF NOT EXISTS d3_status VARCHAR(20) DEFAULT 'pending' CHECK (d3_status IN ('pending', 'completed', 'missed')),
ADD COLUMN IF NOT EXISTS d7_status VARCHAR(20) DEFAULT 'pending' CHECK (d7_status IN ('pending', 'completed', 'missed')),
ADD COLUMN IF NOT EXISTS d14_status VARCHAR(20) DEFAULT 'pending' CHECK (d14_status IN ('pending', 'completed', 'missed')),
ADD COLUMN IF NOT EXISTS d28_30_status VARCHAR(20) DEFAULT 'pending' CHECK (d28_30_status IN ('pending', 'completed', 'missed'));

-- Add updated_by columns (references staff who updated the status)
ALTER TABLE public.treatment_records
ADD COLUMN IF NOT EXISTS d0_updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS d3_updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS d7_updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS d14_updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS d28_30_updated_by UUID REFERENCES auth.users(id);

-- Add updated_at columns (timestamp when status was updated)
ALTER TABLE public.treatment_records
ADD COLUMN IF NOT EXISTS d0_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS d3_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS d7_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS d14_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS d28_30_updated_at TIMESTAMP WITH TIME ZONE;

-- Add injection_records JSONB column for detailed tracking
ALTER TABLE public.treatment_records
ADD COLUMN IF NOT EXISTS injection_records JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_treatment_records_d0_status ON public.treatment_records(d0_status);
CREATE INDEX IF NOT EXISTS idx_treatment_records_d3_status ON public.treatment_records(d3_status);
CREATE INDEX IF NOT EXISTS idx_treatment_records_d7_status ON public.treatment_records(d7_status);
CREATE INDEX IF NOT EXISTS idx_treatment_records_d14_status ON public.treatment_records(d14_status);
CREATE INDEX IF NOT EXISTS idx_treatment_records_d28_30_status ON public.treatment_records(d28_30_status);

-- Create indexes for updated_by columns
CREATE INDEX IF NOT EXISTS idx_treatment_records_d0_updated_by ON public.treatment_records(d0_updated_by);
CREATE INDEX IF NOT EXISTS idx_treatment_records_d3_updated_by ON public.treatment_records(d3_updated_by);
CREATE INDEX IF NOT EXISTS idx_treatment_records_d7_updated_by ON public.treatment_records(d7_updated_by);
CREATE INDEX IF NOT EXISTS idx_treatment_records_d14_updated_by ON public.treatment_records(d14_updated_by);
CREATE INDEX IF NOT EXISTS idx_treatment_records_d28_30_updated_by ON public.treatment_records(d28_30_updated_by);

-- Update existing records to have 'pending' status if they have a date but no status
UPDATE public.treatment_records
SET d0_status = 'pending'
WHERE d0_date IS NOT NULL AND d0_status IS NULL;

UPDATE public.treatment_records
SET d3_status = 'pending'
WHERE d3_date IS NOT NULL AND d3_status IS NULL;

UPDATE public.treatment_records
SET d7_status = 'pending'
WHERE d7_date IS NOT NULL AND d7_status IS NULL;

UPDATE public.treatment_records
SET d14_status = 'pending'
WHERE d14_date IS NOT NULL AND d14_status IS NULL;

UPDATE public.treatment_records
SET d28_30_status = 'pending'
WHERE d28_30_date IS NOT NULL AND d28_30_status IS NULL;










