-- Migration script to update vaccine status values to simplified format
-- Changes "Low on Stock" to "Low"
-- Status values: Available, Low, Out of Stock, Expired

-- Step 1: Update existing records
UPDATE public.vaccines 
SET status = 'Low' 
WHERE status = 'Low on Stock';

-- Step 2: Update the CHECK constraint to allow the new status values
ALTER TABLE public.vaccines 
DROP CONSTRAINT IF EXISTS vaccines_status_check;

ALTER TABLE public.vaccines 
ADD CONSTRAINT vaccines_status_check 
CHECK (status IN ('Available', 'Low', 'Out of Stock', 'Expired'));

-- Step 3: Update the trigger function to use the new status values
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

-- Step 4: Verify the changes
SELECT DISTINCT status FROM public.vaccines ORDER BY status;

-- Step 5: Show sample records with new status
SELECT vaccine_brand, stock_quantity, expiry_date, status 
FROM public.vaccines 
ORDER BY created_at DESC 
LIMIT 10;

