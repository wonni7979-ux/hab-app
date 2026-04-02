-- ===============================================
-- Admin KPI Macro Stats securely fetched via RPC
-- ===============================================

CREATE OR REPLACE FUNCTION public.get_admin_macro_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _total_users INT;
    _dau INT;
    _total_tx INT;
    _top_categories JSON;
    _peak_hours JSON;
    _this_month JSON;
BEGIN
    -- 1. Security Check: Only allow users in public.admins
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- 2. Aggregate Total Active Users
    SELECT count(DISTINCT user_id) INTO _total_users FROM public.transactions;

    -- 3. Aggregate DAU (Active in last 24h)
    SELECT count(DISTINCT user_id) INTO _dau FROM public.transactions WHERE created_at >= now() - interval '24 hours';
    
    -- 4. Total TX count
    SELECT count(*) INTO _total_tx FROM public.transactions;

    -- 5. Top 5 Expense Categories ALL-TIME
    SELECT json_agg(row_to_json(t)) INTO _top_categories
    FROM (
        SELECT 
            COALESCE(c.name, '미분류') as name, 
            count(*) as count, 
            sum(t.amount) as amount
        FROM public.transactions t
        LEFT JOIN public.categories c ON t.category_id = c.id
        WHERE t.type = 'expense'
        GROUP BY c.name
        ORDER BY count DESC
        LIMIT 5
    ) t;

    -- 6. Peak Entry Hours (0~23) ALL-TIME
    SELECT json_agg(row_to_json(h)) INTO _peak_hours
    FROM (
        SELECT 
            extract(hour from created_at)::INT as hour, 
            count(*) as count
        FROM public.transactions
        GROUP BY hour
        ORDER BY hour ASC
    ) h;

    -- 7. This Month's Income vs Expense (Replaces old client-side logic)
    SELECT json_agg(row_to_json(m)) INTO _this_month
    FROM (
        SELECT 
            type as name, 
            sum(amount) as value 
        FROM public.transactions 
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
        GROUP BY type
    ) m;

    RETURN json_build_object(
        'total_users', _total_users,
        'dau', _dau,
        'total_tx', _total_tx,
        'top_categories', COALESCE(_top_categories, '[]'::json),
        'peak_hours', COALESCE(_peak_hours, '[]'::json),
        'this_month', COALESCE(_this_month, '[]'::json)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_macro_stats() TO authenticated;
