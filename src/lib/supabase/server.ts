import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            // [CRITICAL FIX] If maxAge is 0, it's a deletion. Don't strip it!
                            if (options?.maxAge === 0) {
                                cookieStore.set(name, value, options)
                            } else {
                                // For regular sessions, strip maxAge/expires to ensure Absolute Session security.
                                const { maxAge, expires, ...rest } = options || {}
                                cookieStore.set(name, value, rest)
                            }
                        })
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
