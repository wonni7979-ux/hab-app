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
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('session_presence', 'active', { maxAge: 25, path: '/', sameSite: 'lax' })

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
