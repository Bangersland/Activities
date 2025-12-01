-- Migration script to update vaccine status values to simplified format
-- This script handles all possible existing status values and updates them first
-- BEFORE changing the constraint to avoid constraint violation errors

-- Step 1: Update ALL existing status values to the new format
-- Handle lowercase versions
UPDATE public.vaccines 
SET status = 'Available' 
WHERE status IN ('available', 'Available');

UPDATE public.vaccines 
SET status = 'Low' 
WHERE status IN ('low_on_stock', 'Low on Stock', 'Low');

UPDATE public.vaccines 
SET status = 'Out of Stock' 
WHERE status IN ('out_of_stock', 'Out of Stock');

UPDATE public.vaccines 
SET status = 'Expired' 
WHERE status IN ('expired', 'Expired');

-- Step 2: Verify all statuses are updated (check for any remaining old values)
SELECT DISTINCT status FROM public.vaccines ORDER BY status;

-- Step 3: If there are any NULL or unexpected values, set them to a default
UPDATE public.vaccines 
SET status = 'Available' 
WHERE status IS NULL OR status NOT IN ('Available', 'Low', 'Out of Stock', 'Expired');

-- Step 4: Now update the CHECK constraint (safe to do after all data is updated)
ALTER TABLE public.vaccines 
DROP CONSTRAINT IF EXISTS vaccines_status_check;

ALTER TABLE public.vaccines 
ADD CONSTRAINT vaccines_status_check 
CHECK (status IN ('Available', 'Low', 'Out of Stock', 'Expired'));

-- Step 5: Update the trigger function to use the new status values
CREATE OR REPLACE FUNCTION update_vaccine_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Set status based on expiry date and stock quantity
    IF NEW.expiry_date < CURRENT_DATE THEN
        NEW.status = 'Expired';
    ELSIF NEW.stock_quantity = 0 THEN
        NEW.status = 'Out of Stock';
    ELSIF NEW.stock_quantity <= 20 THEN
        NEW.status = 'Low';
    ELSE
        NEW.status = 'Available';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Trigger the status update for all existing records to ensure consistency
UPDATE public.vaccines 
SET stock_quantity = stock_quantity 
WHERE TRUE;  -- This will trigger the status update function

-- Step 7: Final verification
SELECT 
    status, 
    COUNT(*) as count 
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

-- Show sample records
SELECT vaccine_brand, stock_quantity, expiry_date, status 
FROM public.vaccines 
ORDER BY created_at DESC 
LIMIT 10;

