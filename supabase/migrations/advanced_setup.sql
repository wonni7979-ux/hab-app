-- ==========================================
-- Advanced Admin Features (RBAC, Ads, Notices)
-- ==========================================

-- 1. RBAC (Role-Based Access Control)
-- Add role to admins table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admins' AND column_name='role') THEN 
        ALTER TABLE public.admins ADD COLUMN role TEXT DEFAULT 'cs' NOT NULL;
    END IF; 
END $$;

-- 'superadmin': Can modify system settings, DB rows, categories, and view all raw data.
-- 'cs': Can only view stats and masked data, and help answer user queries.

-- 2. Announcements Table (System Notices)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active announcements" ON public.announcements
    FOR SELECT USING (is_active = true);
CREATE POLICY "Only superadmins can manage announcements" ON public.announcements
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'superadmin'));

-- 3. Targeted Advertisements Table (Financial Product Recommendations)
CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_category_type TEXT, -- e.g., 'expense'
    target_amount_threshold NUMERIC, -- e.g., 100000
    click_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active ads" ON public.advertisements
    FOR SELECT USING (is_active = true);
CREATE POLICY "Only superadmins can manage ads" ON public.advertisements
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'superadmin'));
