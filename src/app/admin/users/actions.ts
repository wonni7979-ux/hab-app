'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendPasswordResetAdmin(email: string) {
    const supabase = await createClient()

    // Optionally check if the caller is an admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: '인증되지 않음' }
    
    const { data: admin } = await supabase.from('admins').select('role').eq('id', user.id).single()
    if (!admin) return { error: '권한이 없습니다.' }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/update-password`,
    })

    if (error) {
        return { error: '초기화 메일 발송 실패: ' + error.message }
    }

    return { success: `[${email}] 님의 메일함으로 비밀번호 초기화 링크가 발송되었습니다.` }
}
