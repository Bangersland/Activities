-- Diagnostic script to check current status values in vaccines table
-- Run this FIRST to see what status values exist before migration

-- Check all distinct status values
SELECT 
    status, 
    COUNT(*) as count,
    'Current status values' as info
FROM public.vaccines 
GROUP BY status 
ORDER BY status;

-- Check for any NULL statuses
SELECT 
    COUNT(*) as null_status_count,
    'NULL status count' as info
FROM public.vaccines 
WHERE status IS NULL;

-- Show sample records with their statuses
SELECT 
    id,
    vaccine_brand, 
    stock_quantity, 
    expiry_date, 
    status,
    created_at
FROM public.vaccines 
ORDER BY created_at DESC 
LIMIT 20;

