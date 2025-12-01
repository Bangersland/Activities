-- =====================================================
-- DIAGNOSTIC SCRIPT: Find problematic status values
-- Run this FIRST to see what's causing the constraint error
-- =====================================================

-- Show all distinct status values and their counts
SELECT 
    'All status values:' as check_type,
    status, 
    COUNT(*) as count,
    'These should be: Available, Low, Out of Stock, or Expired' as expected
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

-- Show rows with problematic status values
SELECT 
    'Problematic rows:' as check_type,
    id,
    vaccine_brand,
    status,
    stock_quantity,
    expiry_date
FROM public.vaccines 
WHERE status IS NULL 
   OR status NOT IN ('Available', 'Low', 'Out of Stock', 'Expired')
ORDER BY status;

-- Show status values with their exact character codes (to find hidden characters)
SELECT 
    'Status with character codes:' as check_type,
    status,
    LENGTH(status) as length,
    ASCII(SUBSTRING(status, 1, 1)) as first_char_code,
    COUNT(*) as count
FROM public.vaccines 
GROUP BY status, LENGTH(status), ASCII(SUBSTRING(status, 1, 1))
ORDER BY status;

