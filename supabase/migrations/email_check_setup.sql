-- ==========================================
-- Email Exist Check Function (for Password Recovery validation)
-- ==========================================

-- A secure server-side function to check if an email exists in the system without needing the Service Role Key.
-- SECURITY DEFINER allows this function to bypass RLS and read auth.users safely on behalf of the public user.

CREATE OR REPLACE FUNCTION public.check_user_exists(lookup_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_exist BOOLEAN;
BEGIN
  -- Search safely against auth.users
  SELECT exists(
    SELECT 1 FROM auth.users WHERE email = lookup_email
  ) INTO is_exist;
  
  RETURN is_exist;
END;
$$;

-- Grant execute permissions to the anonymous and authenticated users so the frontend can call it
GRANT EXECUTE ON FUNCTION public.check_user_exists(TEXT) TO anon, authenticated;
