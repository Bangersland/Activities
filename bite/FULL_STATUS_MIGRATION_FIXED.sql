-- =====================================================
-- COMPLETE MIGRATION SCRIPT: Update Vaccine Status Values (FIXED)
-- This script handles the constraint violation error
-- =====================================================

-- STEP 0: First, let's see what status values currently exist
SELECT 'Current status values in database:' as info;
SELECT DISTINCT status, COUNT(*) as count 
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

-- STEP 1: Temporarily disable the constraint (if it exists)
-- We'll drop it, update data, then recreate it
ALTER TABLE public.vaccines 
DROP CONSTRAINT IF EXISTS vaccines_status_check;

-- STEP 2: Update ALL possible status variations comprehensively
-- Handle every possible variation we can think of

-- Update 'available' (lowercase) to 'Available'
UPDATE public.vaccines 
SET status = 'Available' 
WHERE LOWER(TRIM(status)) = 'available';

-- Update 'low_on_stock' (snake_case) to 'Low'
UPDATE public.vaccines 
SET status = 'Low' 
WHERE LOWER(TRIM(status)) = 'low_on_stock';

-- Update 'Low on Stock' (with spaces) to 'Low'
UPDATE public.vaccines 
SET status = 'Low' 
WHERE status = 'Low on Stock' 
   OR LOWER(TRIM(status)) = 'low on stock';

-- Update 'out_of_stock' (snake_case) to 'Out of Stock'
UPDATE public.vaccines 
SET status = 'Out of Stock' 
WHERE LOWER(TRIM(status)) = 'out_of_stock';

-- Update 'Out of Stock' (with spaces) to 'Out of Stock'
UPDATE public.vaccines 
SET status = 'Out of Stock' 
WHERE LOWER(TRIM(status)) = 'out of stock';

-- Update 'expired' (lowercase) to 'Expired'
UPDATE public.vaccines 
SET status = 'Expired' 
WHERE LOWER(TRIM(status)) = 'expired';

-- STEP 3: Handle any remaining unexpected values
-- Set them to 'Available' as a safe default
UPDATE public.vaccines 
SET status = 'Available' 
WHERE status IS NULL 
   OR TRIM(status) = ''
   OR status NOT IN ('Available', 'Low', 'Out of Stock', 'Expired');

-- STEP 4: Verify all statuses are now correct before adding constraint
SELECT 'Status values after update (should only be: Available, Low, Out of Stock, Expired):' as info;
SELECT DISTINCT status, COUNT(*) as count 
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

-- STEP 5: Check if there are any rows that still don't match
SELECT 'Rows that still need fixing (should be 0):' as info;
SELECT COUNT(*) as problematic_rows
FROM public.vaccines 
WHERE status IS NULL 
   OR status NOT IN ('Available', 'Low', 'Out of Stock', 'Expired');

-- STEP 6: Now safely add the constraint
ALTER TABLE public.vaccines 
ADD CONSTRAINT vaccines_status_check 
CHECK (status IN ('Available', 'Low', 'Out of Stock', 'Expired'));

-- STEP 7: Update the trigger function
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

-- STEP 8: Recalculate status for all existing records
UPDATE public.vaccines 
SET stock_quantity = stock_quantity;  -- This triggers the status update

-- STEP 9: Final verification
SELECT 'Final status distribution:' as info;
SELECT 
    status, 
    COUNT(*) as count 
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

SELECT 'Migration completed successfully!' as result;

