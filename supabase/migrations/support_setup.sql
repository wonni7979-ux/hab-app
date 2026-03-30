-- ==========================================
-- Customer Support Messaging Table
-- ==========================================

-- 1. Support Messages Table
-- Used for 1:1 user-to-admin communications
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    message TEXT NOT NULL,
    reply TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can insert their own messages
CREATE POLICY "Users can insert their own support messages" ON public.support_messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can read their own messages
CREATE POLICY "Users can read their own support messages" ON public.support_messages
    FOR SELECT USING (user_id = auth.uid());

-- Only admins ('superadmin' or 'cs') can read all support messages
CREATE POLICY "Admins can read all support messages" ON public.support_messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND (role = 'superadmin' OR role = 'cs')));

-- Only admins ('superadmin' or 'cs') can update support messages (to add reply and change status)
CREATE POLICY "Admins can update support messages" ON public.support_messages
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND (role = 'superadmin' OR role = 'cs')));
