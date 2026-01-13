import { NextResponse } from 'next/server'
// 다음 단계를 위해 createClient 유틸리티를 가져옵니다.
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // "next"가 존재하면 인증 후 해당 페이지로 리다이렉트합니다.
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // 로컬 개발에서는 일반적으로 null입니다.
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // 로컬에서는 x-forwarded-host를 무시할 수 있습니다.
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // 오류가 발생한 경우 오류 페이지로 리다이렉트합니다.
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
