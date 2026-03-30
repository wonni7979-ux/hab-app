'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')

    // Set initial presence signal to pass middleware on first redirect
    const now = Date.now().toString()
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('session_presence', now, { maxAge: 25, path: '/', sameSite: 'lax' })

    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: '이메일을 확인하여 인증을 완료해 주세요!' }
}

export async function signout() {
    const supabase = await createClient()

    // 1. Revoke session on Supabase server
    await supabase.auth.signOut()

    // 2. NUCLEAR PHYSICAL DELETE: Force all cookies to die with explicit path
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    for (const cookie of allCookies) {
        cookieStore.delete({
            name: cookie.name,
            path: '/', // Explicitly target root path where most auth cookies live
        })
    }

    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    if (!email) return { error: '이메일을 입력해주세요.' }

    // 1. 방금 만든 안전한 검색 함수(RPC)를 통해 이메일 점검
    const { data: isExist, error: rpcError } = await supabase.rpc('check_user_exists', { lookup_email: email })

    if (rpcError) {
        console.error("이메일 체크 에러:", rpcError)
    } else if (isExist === false) {
        // 등록되지 않은 이메일이면 바로 실패 처리
        return { error: '가입되지 않은 이메일입니다.' }
    }

    // 2. 이메일이 존재하면 리셋 시스템 작동
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/update-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' }
}
