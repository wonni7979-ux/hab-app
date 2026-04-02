-- ===============================================
-- System Logs and Security Monitoring Setup
-- ===============================================

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    log_level VARCHAR(20) NOT NULL, -- 'INFO', 'WARNING', 'ERROR', 'SECURITY'
    source VARCHAR(50) NOT NULL, -- 'frontend', 'backend', 'admin_auth', etc.
    action VARCHAR(255) NOT NULL, -- The main event description
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional, who triggered it
    details JSONB -- Stack traces, request URLs, user agents
);

-- Enable Row Level Security
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Any authenticated user can INSERT logs (for error tracking)
CREATE POLICY "Anyone can insert logs" ON public.system_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- Policy 2: Anonymous can insert logs (for login page errors)
CREATE POLICY "Anon can insert logs" ON public.system_logs
FOR INSERT TO anon
WITH CHECK (true);

-- Policy 3: Only admins can SELECT (read) logs
CREATE POLICY "Only admins can view logs" ON public.system_logs
FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
);

-- Note: We do not allow UPDATE or DELETE to make it a true append-only log.

-- Optional: Create an index for faster querying by admins
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_log_level ON public.system_logs(log_level);
