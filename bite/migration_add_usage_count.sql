-- Migration script to add usage_count column to vaccines table
-- This tracks how many people have received a vaccine before deducting stock

-- Add the usage_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vaccines' 
        AND column_name = 'usage_count'
    ) THEN
        ALTER TABLE public.vaccines 
        ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Column usage_count added successfully';
    ELSE
        RAISE NOTICE 'Column usage_count already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vaccines' 
AND column_name = 'usage_count';

