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
                        if (options?.maxAge === 0) {
                            supabaseResponse.cookies.set(name, value, options)
                        } else {
                            const { maxAge, expires, ...rest } = options || {}
                            supabaseResponse.cookies.set(name, value, rest)
                        }
                    })
                },
            },
        }
    )

    // --- [Expert Security] Ultimate Heartbeat & Zombie Guard ---
    const presenceCookie = request.cookies.get('session_presence')
    const hasAuthCookies = request.cookies.getAll().some(c => c.name.startsWith('sb-'))
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth')

    if (hasAuthCookies && !isAuthPage) {
        let isZombie = false
        const currentTime = Date.now()

        if (!presenceCookie) {
            isZombie = true // No heartbeat at all
        } else {
            // VERIFY THE TIMESTAMP INSIDE THE COOKIE
            // Chrome restores session cookies, but the timestamp inside the value will be OLD.
            const presenceTime = parseInt(presenceCookie.value || '0')
            if (isNaN(presenceTime) || (currentTime - presenceTime > 15000)) {
                isZombie = true // Heartbeat is a ghost from the past
            }
        }

        if (isZombie) {
            console.log('🚨 Guard: Zombie session/cookie detected. Purging...')
            const response = NextResponse.redirect(new URL('/login', request.url))

            // Strong purge: Delete all cookies and set no-cache
            request.cookies.getAll().forEach(cookie => {
                response.cookies.delete(cookie.name)
            })
            response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
            return response
        }
    }

    // 세션 실시간 갱신
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user && !isAuthPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const response = NextResponse.redirect(url)
        response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
        return response
    }

    // Reinforce no-cache on all protected responses
    supabaseResponse.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return supabaseResponse
}
