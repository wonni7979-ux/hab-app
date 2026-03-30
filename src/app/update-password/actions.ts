'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: '비밀번호가 일치하지 않습니다.' }
    }
    if (password.length < 6) {
        return { error: '비밀번호는 최소 6자 이상이어야 합니다.' }
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: error.message }
    }

    // Redirect to login (or dashboard) after success
    redirect('/settings/profile?reset=success')
}
