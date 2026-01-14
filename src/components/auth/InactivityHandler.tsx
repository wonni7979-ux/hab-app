'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const INACTIVITY_LIMIT = 10 * 60 * 1000 // 10 minutes

export function InactivityHandler() {
    const router = useRouter()
    const supabase = createClient()
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    // [Expert Security] Shield the UI until verification is complete
    const [isChecking, setIsChecking] = useState(true)

    const handleLogout = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.auth.signOut()
            toast.info('장시간 미사용으로 로그아웃되었습니다.', { duration: 5000, icon: '🔐' })
            router.push('/login')
        }
    }

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT)
    }

    useEffect(() => {
        // 1. Service Worker Kill Switch
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (const registration of registrations) registration.unregister()
            })
        }

        // 2. Heartbeat Updater
        const updatePresence = () => {
            sessionStorage.setItem('last_active_timestamp', Date.now().toString())
            document.cookie = `session_presence=active; path=/; max-age=10; samesite=lax`
        }
        updatePresence()
        const presenceInterval = setInterval(updatePresence, 2000)

        // 3. Boot Validation (The Core Logic)
        const initSecurity = async () => {
            // Clear legacy local storage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) localStorage.removeItem(key)
            })

            const lastActiveTime = sessionStorage.getItem('last_active_timestamp')
            const currentTime = Date.now()

            // Navigation Timing Check
            let isReload = false
            if (typeof performance !== 'undefined') {
                const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
                if (navEntry && navEntry.type === 'reload') {
                    isReload = true
                }
            }

            // Stale Threshold Logic
            // Reload: 30s allowance
            // Restore/Navigate: 3s Strict allowance
            const threshold = isReload ? 30000 : 3000

            const timeGap = lastActiveTime ? currentTime - parseInt(lastActiveTime) : 0
            const isStale = lastActiveTime && (timeGap > threshold)
            const isTabActive = sessionStorage.getItem('app-tab-active')

            // Log for debugging (will show in Verify stage if needed)
            // console.log(`Security Check: Gap=${timeGap}ms, Threshold=${threshold}ms, Reload=${isReload}, Stale=${isStale}`)

            // Detect Zombie Session
            // a) No 'app-tab-active' flag (Fresh tab trying to reuse cookies)
            // b) 'app-tab-active' exists but timestamp is too old (Restored tab)
            if (!isTabActive || isStale) {
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    console.log(`🛡️ Security: Blocking access. Reason: ${isStale ? 'Stale Session' : 'Fresh Tab'}`)

                    // Force Logout
                    await supabase.auth.signOut()
                    document.cookie = 'session_presence=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
                    sessionStorage.clear()

                    // Mark as active for the NEXT login
                    sessionStorage.setItem('app-tab-active', 'true')

                    router.replace('/login')
                    // Keep isChecking = true to hide UI
                    return
                }
                // No user, just mark tab as active
                sessionStorage.setItem('app-tab-active', 'true')
            }

            // Passed all checks
            setIsChecking(false)
        }

        initSecurity()

        // 4. Inactivity Timer
        resetTimer()
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
        const handleActivity = () => resetTimer()
        events.forEach(e => window.addEventListener(e, handleActivity))

        // 5. Before Unload
        const handleUnload = () => {
            sessionStorage.removeItem('app-tab-active')
        }
        window.addEventListener('beforeunload', handleUnload)

        return () => {
            clearInterval(presenceInterval)
            if (timerRef.current) clearTimeout(timerRef.current)
            events.forEach(e => window.removeEventListener(e, handleActivity))
            window.removeEventListener('beforeunload', handleUnload)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // --- The Security Curtain ---
    if (isChecking) {
        return (
            <div className="fixed inset-0 z-[99999] bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground text-sm font-medium">보안 확인 중...</p>
                </div>
            </div>
        )
    }

    return null
}
