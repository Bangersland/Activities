-- Update vaccine status text to be more user-friendly
-- This script updates the status values in the vaccines table

-- First, let's see the current status values
SELECT DISTINCT status FROM public.vaccines;

-- Update the status values to be more user-friendly
UPDATE public.vaccines 
SET status = 'Available' 
WHERE status = 'available';

UPDATE public.vaccines 
SET status = 'Out of Stock' 
WHERE status = 'out_of_stock';

UPDATE public.vaccines 
SET status = 'Low on Stock' 
WHERE status = 'low_on_stock';

UPDATE public.vaccines 
SET status = 'Expired' 
WHERE status = 'expired';

-- Update the CHECK constraint to allow the new status values
ALTER TABLE public.vaccines 
DROP CONSTRAINT IF EXISTS vaccines_status_check;

ALTER TABLE public.vaccines 
ADD CONSTRAINT vaccines_status_check 
CHECK (status IN ('Available', 'Out of Stock', 'Low on Stock', 'Expired'));

-- Update the trigger function to use the new status values
CREATE OR REPLACE FUNCTION update_vaccine_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Set status based on expiry date and stock quantity
    IF NEW.expiry_date < CURRENT_DATE THEN
        NEW.status = 'Expired';
    ELSIF NEW.stock_quantity = 0 THEN
        NEW.status = 'Out of Stock';
    ELSIF NEW.stock_quantity <= 20 THEN
        NEW.status = 'Low on Stock';
    ELSE
        NEW.status = 'Available';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT vaccine_brand, stock_quantity, expiry_date, status 
FROM public.vaccines 
ORDER BY created_at DESC; 