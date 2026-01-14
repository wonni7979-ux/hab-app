import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // Remove maxAge and expires to make it a session cookie
                        const { maxAge, expires, ...rest } = options || {}
                        supabaseResponse.cookies.set(name, value, rest)
                    })
                },
            },
        }
    )

    // --- [Expert Security] Strict Session Guard ---
    // Chrome's "Continue where you left off" can restore session cookies.
    // We check for a specific 'app_session_active' guard cookie.
    const isSessionActive = request.cookies.get('app_session_active')
    const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

    // If we have auth cookies but NO guard cookie, it means the browser process was restarted.
    // We MUST purge the auth cookies to enforce security.
    if (!isSessionActive && hasAuthCookie && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
        console.log('🛡️ Guard: Stale session detected. Purging auth cookies...')
        const response = NextResponse.redirect(new URL('/login', request.url))
        // Delete all supabase related cookies
        request.cookies.getAll().forEach(cookie => {
            if (cookie.name.startsWith('sb-')) {
                response.cookies.delete(cookie.name)
            }
        })
        return response
    }

    // 중요: 상호 검증(auth.getUser())을 통해 세션을 실시간으로 갱신합니다.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
