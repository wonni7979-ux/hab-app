-- ==========================================
-- UX Analytics & Funnel Tracking
-- ==========================================

-- 1. Analytics Logs Table
-- Used to track user interaction stages during transaction entry
CREATE TABLE IF NOT EXISTS public.analytics_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL, -- Distinct per form open
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- 'form_open', 'input_amount', 'select_category', 'select_payment', 'form_close', 'form_complete'
    event_data JSONB DEFAULT '{}'::jsonb, -- Store time spent or last field focused
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own analytics
CREATE POLICY "Users can insert their own analytics logs" ON public.analytics_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only superadmins can read analytics
CREATE POLICY "Superadmins can read all analytics logs" ON public.analytics_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'superadmin'));
