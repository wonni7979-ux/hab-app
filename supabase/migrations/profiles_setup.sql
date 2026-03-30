-- ==========================================
-- Users Profiles Setup (Name & Phone Number & Find ID)
-- ==========================================

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING ( auth.uid() = id );

-- 4. Database Trigger for Profile Creation
-- When a user signs up, Supabase inserts a row into auth.users.
-- We extract the user's name and phone_number from raw_user_meta_data and auto-create the profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone_number)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone_number'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Secure RPC for "Find ID"
-- This function takes a name and phone, and returns the strictly obfuscated email (e.g., he***@gmail.com)
CREATE OR REPLACE FUNCTION public.find_user_email(
    lookup_name TEXT, 
    lookup_phone TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_email TEXT;
    email_parts TEXT[];
    local_part TEXT;
    domain_part TEXT;
    obfuscated_email TEXT;
BEGIN
    SELECT u.email INTO found_email
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id
    WHERE p.name = lookup_name 
      AND p.phone_number = lookup_phone
    LIMIT 1;

    IF found_email IS NULL THEN
        RETURN NULL;
    END IF;

    -- Obfuscate the email (e.g., hello@gmail.com -> he***@gmail.com)
    email_parts := string_to_array(found_email, '@');
    IF array_length(email_parts, 1) = 2 THEN
        local_part := email_parts[1];
        domain_part := email_parts[2];
        
        IF length(local_part) <= 2 THEN
            obfuscated_email := left(local_part, 1) || '***@' || domain_part;
        ELSE
            obfuscated_email := left(local_part, 2) || repeat('*', length(local_part) - 2) || '@' || domain_part;
        END IF;
        
        RETURN obfuscated_email;
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_user_email(TEXT, TEXT) TO anon, authenticated;
