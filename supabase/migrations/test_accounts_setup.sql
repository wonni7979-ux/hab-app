-- ==========================================
-- Final Enhancements (Test Accounts)
-- ==========================================

-- 1. Test Accounts Table
-- Used to exclude dummy data from system-wide macro analytics.
CREATE TABLE IF NOT EXISTS public.test_accounts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    registered_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.test_accounts ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read/write test_accounts list
CREATE POLICY "Superadmins can read test accounts" ON public.test_accounts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'superadmin')
        OR user_id = auth.uid() -- Users can see if they themselves are marked as test (optional)
    );

CREATE POLICY "Superadmins can insert test accounts" ON public.test_accounts
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmins can delete test accounts" ON public.test_accounts
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'superadmin'));
