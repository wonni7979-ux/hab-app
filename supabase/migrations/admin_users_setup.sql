-- ===============================================
-- Admin User Management Security RPCs
-- ===============================================

-- 1. Fetch All Users securely via RPC (to bypass needing Service Key in frontend)
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT json_agg(
        json_build_object(
            'id', u.id,
            'email', u.email,
            'created_at', u.created_at,
            'banned_until', u.banned_until,
            'is_admin', CASE WHEN a.id IS NOT NULL THEN true ELSE false END
        )
    ) INTO _result
    FROM auth.users u
    LEFT JOIN public.admins a ON u.id = a.id
    ORDER BY u.created_at DESC;

    RETURN COALESCE(_result, '[]'::json);
END;
$$;


-- 2. Ban / Unban User
CREATE OR REPLACE FUNCTION public.admin_ban_user(target_user_id UUID, is_banned BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Prevent banning oneself
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot ban yourself';
    END IF;

    IF is_banned THEN
        UPDATE auth.users SET banned_until = '2099-12-31'::timestamp WHERE id = target_user_id;
    ELSE
        UPDATE auth.users SET banned_until = NULL WHERE id = target_user_id;
    END IF;

    RETURN TRUE;
END;
$$;


-- 3. Toggle Admin Role
CREATE OR REPLACE FUNCTION public.admin_toggle_role(target_user_id UUID, grant_admin BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Prevent revoking oneself
    IF target_user_id = auth.uid() AND grant_admin = FALSE THEN
        RAISE EXCEPTION 'Cannot revoke your own admin rights';
    END IF;

    IF grant_admin THEN
        INSERT INTO public.admins (id, role) VALUES (target_user_id, 'admin') ON CONFLICT (id) DO NOTHING;
    ELSE
        DELETE FROM public.admins WHERE id = target_user_id;
    END IF;

    RETURN TRUE;
END;
$$;


-- 4. Delete User (Hard Delete)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Prevent deleting oneself
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete yourself';
    END IF;

    DELETE FROM auth.users WHERE id = target_user_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ban_user(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_role(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
