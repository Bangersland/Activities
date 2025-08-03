-- Verify Staff Accounts SQL Script
-- Run this in your Supabase SQL Editor to automatically verify all staff accounts

-- 1. Update auth.users table to mark staff accounts as confirmed
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  last_sign_in_at = NOW(),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    '{"account_verified": true, "verification_status": "confirmed"}'::jsonb
WHERE 
  id IN (
    SELECT user_id 
    FROM public.staff_details 
    WHERE user_id IS NOT NULL
  )
  AND email_confirmed_at IS NULL;

-- 2. Update profiles table to ensure staff role is set
UPDATE public.profiles 
SET 
  role = 'staff',
  updated_at = NOW()
WHERE 
  id IN (
    SELECT user_id 
    FROM public.staff_details 
    WHERE user_id IS NOT NULL
  )
  AND role IS NULL;

-- 3. Check verification status
SELECT 
  'Verification Summary:' as info,
  COUNT(*) as total_staff_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as verified_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unverified_users
FROM auth.users 
WHERE id IN (
  SELECT user_id 
  FROM public.staff_details 
  WHERE user_id IS NOT NULL
);

-- 4. Show staff users and their verification status
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.last_sign_in_at,
  p.username,
  p.role,
  sd.job_position,
  sd.status as staff_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.staff_details sd ON u.id = sd.user_id
WHERE u.id IN (
  SELECT user_id 
  FROM public.staff_details 
  WHERE user_id IS NOT NULL
)
ORDER BY u.created_at DESC;

-- 5. Create a function to automatically verify new staff accounts
CREATE OR REPLACE FUNCTION auto_verify_staff_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's email confirmation status
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      '{"account_verified": true, "verification_status": "confirmed"}'::jsonb
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to automatically verify staff accounts when they're created
DROP TRIGGER IF EXISTS auto_verify_staff_trigger ON public.staff_details;
CREATE TRIGGER auto_verify_staff_trigger
  AFTER INSERT ON public.staff_details
  FOR EACH ROW
  EXECUTE FUNCTION auto_verify_staff_account();

-- 7. Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'auto_verify_staff_trigger';

-- 8. Test the verification by showing current staff status
SELECT 
  'Current Staff Verification Status:' as info,
  COUNT(*) as total_staff,
  COUNT(CASE WHEN u.email_confirmed_at IS NOT NULL THEN 1 END) as verified,
  COUNT(CASE WHEN u.email_confirmed_at IS NULL THEN 1 END) as unverified
FROM public.staff_details sd
JOIN auth.users u ON sd.user_id = u.id; 