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
                        // [CRITICAL FIX] If maxAge is 0, it means Supabase is trying to DELETE the cookie.
                        // We must let it through, otherwise logout won't work.
                        if (options?.maxAge === 0) {
                            supabaseResponse.cookies.set(name, value, options)
                        } else {
                            // For regular sets, strip maxAge/expires to make it a session cookie (Absolute Security).
                            const { maxAge, expires, ...rest } = options || {}
                            supabaseResponse.cookies.set(name, value, rest)
                        }
                    })
                },
            },
        }
    )

    // --- [Expert Security] Ultimate Heartbeat Guard ---
    const hasPresenceSignal = request.cookies.has('session_presence')
    const hasAuthCookies = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth')

    // If auth cookies exist but Heartbeat is MISSIONG on a protected route, it's a zombie session.
    if (hasAuthCookies && !hasPresenceSignal && !isAuthPage) {
        console.log('🚨 Guard: Zombie session detected via Heartbeat failure. Purging...')
        const response = NextResponse.redirect(new URL('/login', request.url))
        request.cookies.getAll().forEach(cookie => {
            if (cookie.name.startsWith('sb-')) {
                response.cookies.delete(cookie.name)
            }
        })
        return response
    }

    // 세션 실시간 갱신
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user && !isAuthPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
