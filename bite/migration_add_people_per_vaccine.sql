-- Migration script to add people_per_vaccine column to existing vaccines table
-- Run this script if you already have a vaccines table and need to add the new column

-- Add the people_per_vaccine column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vaccines' 
        AND column_name = 'people_per_vaccine'
    ) THEN
        ALTER TABLE public.vaccines 
        ADD COLUMN people_per_vaccine INTEGER NOT NULL DEFAULT 1;
        
        RAISE NOTICE 'Column people_per_vaccine added successfully';
    ELSE
        RAISE NOTICE 'Column people_per_vaccine already exists';
    END IF;
END $$;

-- Update existing records to have a default value of 1 if they are NULL (shouldn't happen with NOT NULL, but just in case)
UPDATE public.vaccines 
SET people_per_vaccine = 1 
WHERE people_per_vaccine IS NULL;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vaccines' 
AND column_name = 'people_per_vaccine';

