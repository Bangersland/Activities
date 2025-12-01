-- =====================================================
-- UPDATE STATUS LOGIC: Available, Low, Expired Only
-- Rules:
--   - Expired: if expiry_date <= CURRENT_DATE
--   - Available: if stock_quantity > 20 AND not expired
--   - Low: if stock_quantity <= 20 AND not expired
-- =====================================================

-- STEP 1: Drop the old constraint
ALTER TABLE public.vaccines 
DROP CONSTRAINT IF EXISTS vaccines_status_check;

-- STEP 2: Update all existing status values
-- First, update expired vaccines
UPDATE public.vaccines 
SET status = 'Expired' 
WHERE expiry_date <= CURRENT_DATE;

-- Then update non-expired vaccines based on stock
UPDATE public.vaccines 
SET status = CASE 
    WHEN expiry_date > CURRENT_DATE AND stock_quantity > 20 THEN 'Available'
    WHEN expiry_date > CURRENT_DATE AND stock_quantity <= 20 THEN 'Low'
    ELSE 'Expired'
END
WHERE expiry_date <= CURRENT_DATE OR expiry_date > CURRENT_DATE;

-- Handle any NULL or unexpected values
UPDATE public.vaccines 
SET status = CASE 
    WHEN expiry_date <= CURRENT_DATE THEN 'Expired'
    WHEN stock_quantity > 20 THEN 'Available'
    ELSE 'Low'
END
WHERE status IS NULL 
   OR status NOT IN ('Available', 'Low', 'Expired');

-- STEP 3: Add new constraint (only 3 status values)
ALTER TABLE public.vaccines 
ADD CONSTRAINT vaccines_status_check 
CHECK (status IN ('Available', 'Low', 'Expired'));

-- STEP 4: Update the trigger function with new logic
CREATE OR REPLACE FUNCTION update_vaccine_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Priority 1: Check if expired (expiry_date <= current date)
    IF NEW.expiry_date <= CURRENT_DATE THEN
        NEW.status = 'Expired';
    -- Priority 2: Check stock quantity for non-expired vaccines
    ELSIF NEW.stock_quantity > 20 THEN
        NEW.status = 'Available';
    ELSE
        -- stock_quantity <= 20 and not expired
        NEW.status = 'Low';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Recalculate status for all existing records
UPDATE public.vaccines 
SET stock_quantity = stock_quantity;  -- This triggers the status update

-- STEP 6: Verification
SELECT 'Status distribution after update:' as info;
SELECT 
    status, 
    COUNT(*) as count 
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

-- Show sample records with their statuses
SELECT 
    vaccine_brand, 
    stock_quantity, 
    expiry_date, 
    status,
    CASE 
        WHEN expiry_date <= CURRENT_DATE THEN 'Should be Expired'
        WHEN stock_quantity > 20 THEN 'Should be Available'
        ELSE 'Should be Low'
    END as expected_status
FROM public.vaccines 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'Status logic updated successfully!' as result;

