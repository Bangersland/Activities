-- =====================================================
-- COMPLETE MIGRATION SCRIPT: Update Vaccine Status Values
-- Changes: "Low on Stock" -> "Low"
-- Status Values: Available, Low, Out of Stock, Expired
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Update all existing status values to new format
-- =====================================================

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

-- Handle any NULL or unexpected values (set to 'Available' as default)
UPDATE public.vaccines 
SET status = 'Available' 
WHERE status IS NULL 
   OR status NOT IN ('Available', 'Low', 'Out of Stock', 'Expired');

-- =====================================================
-- STEP 2: Drop old constraint if it exists
-- =====================================================

ALTER TABLE public.vaccines 
DROP CONSTRAINT IF EXISTS vaccines_status_check;

-- =====================================================
-- STEP 3: Add new constraint with simplified status values
-- =====================================================

ALTER TABLE public.vaccines 
ADD CONSTRAINT vaccines_status_check 
CHECK (status IN ('Available', 'Low', 'Out of Stock', 'Expired'));

-- =====================================================
-- STEP 4: Update the trigger function to use new status values
-- =====================================================

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

-- =====================================================
-- STEP 5: Recalculate status for all existing records
-- =====================================================

UPDATE public.vaccines 
SET stock_quantity = stock_quantity;  -- This triggers the status update function

-- =====================================================
-- STEP 6: Verification queries
-- =====================================================

-- Show status distribution
SELECT 
    status, 
    COUNT(*) as count 
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

-- Show sample records
SELECT 
    vaccine_brand, 
    stock_quantity, 
    expiry_date, 
    status 
FROM public.vaccines 
ORDER BY created_at DESC 
LIMIT 10;

COMMIT;

-- =====================================================
-- Migration Complete!
-- All status values are now: Available, Low, Out of Stock, Expired
-- =====================================================

