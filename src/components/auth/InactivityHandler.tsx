'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const INACTIVITY_LIMIT = 10 * 60 * 1000 // 10 minutes (in milliseconds)

export function InactivityHandler() {
    const router = useRouter()
    const supabase = createClient()
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const handleLogout = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        // Only log out if there is an active user
        if (user) {
            await supabase.auth.signOut()
            toast.info('장시간 미사용으로 인해 안전하게 로그아웃되었습니다.', {
                duration: 5000,
                icon: '🔐'
            })
            router.push('/login')
        }
    }

    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }
        timerRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT)
    }

    useEffect(() => {
        // --- [Expert Security] Service Worker Kill Switch ---
        // Force unregister any existing service workers to prevent caching ghosts.
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    console.log('🛡️ Security: Unregistering Service Worker:', registration)
                    registration.unregister()
                }
            })
        }

        // --- [Expert Security] Hyper-Strict Heartbeat ---
        const updatePresence = () => {
            // Update timestamp constantly (Every 2 seconds)
            sessionStorage.setItem('last_active_timestamp', Date.now().toString())
            document.cookie = `session_presence=active; path=/; max-age=10; samesite=lax`
        }

        // Initial update
        updatePresence()

        // Update presence every 2 seconds
        const presenceInterval = setInterval(updatePresence, 2000)

        // --- [Expert Security] Boot Validation ---
        const initSecurity = async () => {
            // 1. Aggressively clear legacy storage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) localStorage.removeItem(key)
            })

            // 2. Tab Session Validation (Timestamp & Navigation Type)
            const lastActiveTime = sessionStorage.getItem('last_active_timestamp')
            const currentTime = Date.now()

            // Get navigation type to distinguish Reload vs Restore
            // This is critical: Chrome Restore usually comes as 'navigate' type, but with restored sessionStorage.
            // A normal 'navigate' (clicking a link) usually has empty sessionStorage.
            const navEntry = typeof performance !== 'undefined' ? performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming : null
            const isReload = navEntry?.type === 'reload'

            // Stale Threshold: 
            // If Reload (F5): 30 seconds allowance (lenient).
            // If Navigate/Restore: 3 seconds Strict allowance.
            const threshold = isReload ? 30000 : 3000

            // If we have a stored timestamp, check if it's "stale"
            const isStale = lastActiveTime && (currentTime - parseInt(lastActiveTime) > threshold)

            const isTabActive = sessionStorage.getItem('app-tab-active')

            // logic: 
            // - If NO 'app-tab-active' (Fresh Tab) -> Logout
            // - If 'app-tab-active' EXISTS but isStale -> Logout (This catches Chrome Restore)
            if (!isTabActive || isStale) {
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    console.log(`🛡️ Security: Purging session. Reason: ${isStale ? 'Stale Timestamp' : 'Fresh Tab'}. Type: ${navEntry?.type || 'unknown'}. Gap: ${currentTime - parseInt(lastActiveTime || '0')}ms`)
                    await supabase.auth.signOut()

                    document.cookie = 'session_presence=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
                    sessionStorage.clear()
                    sessionStorage.setItem('app-tab-active', 'true')
                    router.refresh()
                    router.push('/login')
                    return
                }
                sessionStorage.setItem('app-tab-active', 'true')
            }
        }

        initSecurity()

        // --- Inactivity Timer Logic ---
        resetTimer()

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
        const handleActivity = () => resetTimer()
        events.forEach(e => window.addEventListener(e, handleActivity))

        // --- [Expert Security] Before Unload Cleanup ---
        const handleUnload = () => {
            // Try to dirty the state on close
            sessionStorage.removeItem('app-tab-active')
        }
        window.addEventListener('beforeunload', handleUnload)

        return () => {
            clearInterval(presenceInterval)
            if (timerRef.current) clearTimeout(timerRef.current)
            events.forEach(e => window.removeEventListener(e, handleActivity))
            window.removeEventListener('beforeunload', handleUnload)
        }
    }, [])

    return null
}
