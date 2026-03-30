'use server'

import { createClient } from '@supabase/supabase-js'

// Initialize a Supabase client with the Service Role Key to bypass RLS and access the Admin API
const getAdminSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY가 서버 환경 변수에 설정되지 않았습니다. 기능을 사용하려면 키를 .env.local에 추가해야 합니다.')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

export async function searchAdminUsers(query: string = '') {
    try {
        const adminAuth = getAdminSupabase().auth.admin

        // Note: Supabase admin listUsers supports pagination but not directly "search by email substring" natively in JS client without doing it in memory,
        // or we can use the undocumented listUsers({ filter: ... }) but the safest is fetching a batch and filtering if we expect few users,
        // OR using RPC. Since we are in the admin dashboard, we can just fetch up to 100 users and filter.
        
        const { data: { users }, error } = await adminAuth.listUsers({
            page: 1,
            perPage: 1000 // Adjust as needed
        })

        if (error) throw error

        let filtered = users
        if (query.trim()) {
            const lowerQ = query.toLowerCase()
            filtered = users.filter(u => u.email?.toLowerCase().includes(lowerQ))
        }

        return {
            success: true,
            users: filtered.map(u => ({
                id: u.id,
                email: u.email || '',
                created_at: u.created_at,
                last_sign_in_at: u.last_sign_in_at || null
            }))
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function sendPasswordResetEmailAction(email: string) {
    try {
        const adminAuth = getAdminSupabase().auth.admin

        // Using generateLink to create a password reset link and email it, OR just using resetting for user
        // The generateLink endpoint is very powerful for admins. We will just use the standard reset method or admin API.
        const { data, error } = await adminAuth.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings/profile`
            }
        })

        if (error) throw error

        return { success: true, link: data.properties?.action_link }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function forceUpdateUserPassword(userId: string, newPassword: string) {
    try {
        const adminAuth = getAdminSupabase().auth.admin

        const { data, error } = await adminAuth.updateUserById(userId, {
            password: newPassword
        })

        if (error) throw error

        return { success: true, email: data.user.email }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
