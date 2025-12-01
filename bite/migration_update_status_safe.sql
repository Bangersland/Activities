-- SAFE Migration script to update vaccine status values
-- Run check_vaccine_statuses.sql FIRST to see what values exist
-- This script updates data BEFORE changing constraints

BEGIN;

-- Step 1: First, let's see what we're working with
SELECT 'Step 1: Current status values' as step;
SELECT DISTINCT status, COUNT(*) as count 
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

-- Step 2: Update all possible status variations to new format
SELECT 'Step 2: Updating status values' as step;

-- Update lowercase 'available' to 'Available'
UPDATE public.vaccines 
SET status = 'Available' 
WHERE LOWER(status) = 'available';

-- Update 'low_on_stock' or 'Low on Stock' to 'Low'
UPDATE public.vaccines 
SET status = 'Low' 
WHERE LOWER(status) IN ('low_on_stock', 'low on stock') 
   OR status = 'Low on Stock';

-- Update 'out_of_stock' to 'Out of Stock'
UPDATE public.vaccines 
SET status = 'Out of Stock' 
WHERE LOWER(status) IN ('out_of_stock', 'out of stock');

-- Update 'expired' to 'Expired'
UPDATE public.vaccines 
SET status = 'Expired' 
WHERE LOWER(status) = 'expired';

-- Step 3: Handle any NULL or unexpected values
SELECT 'Step 3: Handling NULL/unexpected values' as step;
UPDATE public.vaccines 
SET status = 'Available' 
WHERE status IS NULL 
   OR status NOT IN ('Available', 'Low', 'Out of Stock', 'Expired');

-- Step 4: Verify all statuses are now in the correct format
SELECT 'Step 4: Verification - All statuses should be: Available, Low, Out of Stock, or Expired' as step;
SELECT DISTINCT status, COUNT(*) as count 
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

-- Step 5: Drop old constraint if it exists
SELECT 'Step 5: Updating constraint' as step;
ALTER TABLE public.vaccines 
DROP CONSTRAINT IF EXISTS vaccines_status_check;

-- Step 6: Add new constraint with simplified status values
ALTER TABLE public.vaccines 
ADD CONSTRAINT vaccines_status_check 
CHECK (status IN ('Available', 'Low', 'Out of Stock', 'Expired'));

-- Step 7: Update the trigger function
SELECT 'Step 7: Updating trigger function' as step;
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

-- Step 8: Recalculate status for all existing records using the trigger
SELECT 'Step 8: Recalculating statuses for all records' as step;
UPDATE public.vaccines 
SET stock_quantity = stock_quantity;  -- This triggers the status update

-- Step 9: Final verification
SELECT 'Step 9: Final status distribution' as step;
SELECT 
    status, 
    COUNT(*) as count 
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

COMMIT;

-- Success message
SELECT 'Migration completed successfully!' as result;

