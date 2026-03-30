-- ==========================================
-- Admin Role Setup & FDS Trigger logic
-- ==========================================

-- 1. Create admins table (or rely on user_metadata)
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can select the admins table
CREATE POLICY "Admins can view admins" ON public.admins
    FOR SELECT USING (auth.uid() = id);

-- 2. Update Categories and Payment Methods RLS
-- Assuming existing RLS policies are "Authenticated users can select"
-- Add policies to allow ONLY admins to INSERT/UPDATE/DELETE.

-- For categories:
CREATE POLICY "Admins can insert categories" ON public.categories
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update categories" ON public.categories
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
    
CREATE POLICY "Admins can delete categories" ON public.categories
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- For payment_methods:
CREATE POLICY "Admins can insert payment_methods" ON public.payment_methods
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update payment_methods" ON public.payment_methods
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
    
CREATE POLICY "Admins can delete payment_methods" ON public.payment_methods
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- For transactions (User Asset Data Management)
CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update all transactions" ON public.transactions
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins can delete all transactions" ON public.transactions
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- ==========================================
-- 3. FDS (Abnormal Transaction Monitoring)
-- ==========================================

-- Trigger Function: Check transaction velocity
CREATE OR REPLACE FUNCTION public.check_abnormal_transactions()
RETURNS TRIGGER AS $$
DECLARE
    recent_tx_count INT;
    max_tx_per_minute INT := 50; -- Rate limit threshold
    max_amount NUMERIC := 100000000; -- Max amount threshold (100M)
BEGIN
    -- 1. Check Amount Limits
    IF NEW.amount > max_amount THEN
        RAISE EXCEPTION 'Abnormal transaction amount detected: Exceeds maximum allowed limit.';
    END IF;

    -- 2. Check Velocity (Transactions per minute)
    SELECT COUNT(*) INTO recent_tx_count
    FROM public.transactions
    WHERE user_id = NEW.user_id
      AND created_at >= NOW() - INTERVAL '1 minute';

    IF recent_tx_count >= max_tx_per_minute THEN
        RAISE EXCEPTION 'Abnormal activity detected: Too many transactions in a short period (Rate Limit: %/min).', max_tx_per_minute;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to transactions table
DROP TRIGGER IF EXISTS fds_transaction_check ON public.transactions;
CREATE TRIGGER fds_transaction_check
    BEFORE INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_abnormal_transactions();
