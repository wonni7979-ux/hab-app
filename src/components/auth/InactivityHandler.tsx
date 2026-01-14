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
    const [isChecking, setIsChecking] = useState(true)

    const handleLogout = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.auth.signOut()
            sessionStorage.clear()
            document.cookie = 'session_presence=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
            toast.info('장시간 미사용으로 로그아웃되었습니다.', { duration: 5000, icon: '🔐' })
            window.location.href = '/login'
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

        // 2. Heartbeat Updater (Hyper-Short TTL: 5s)
        const updatePresence = () => {
            sessionStorage.setItem('last_active_timestamp', Date.now().toString())
            // CRITICAL: Max-age is 5s. If user is gone for 5s, they are logged out.
            document.cookie = `session_presence=active; path=/; max-age=5; samesite=lax`
        }
        updatePresence()
        const presenceInterval = setInterval(updatePresence, 2000)

        // 3. Boot Validation
        const initSecurity = async () => {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) localStorage.removeItem(key)
            })

            const lastActiveTime = sessionStorage.getItem('last_active_timestamp')
            const currentTime = Date.now()

            let isReload = false
            if (typeof performance !== 'undefined') {
                const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
                if (navEntry && navEntry.type === 'reload') isReload = true
            }

            // Stale Threshold: 5 seconds (Strict)
            // Even on reload, we only allow 5 seconds gap for the heart to stay alive.
            const threshold = isReload ? 10000 : 3000

            const timeGap = lastActiveTime ? currentTime - parseInt(lastActiveTime) : 0
            const isStale = lastActiveTime && (timeGap > threshold)
            const isTabActive = sessionStorage.getItem('app-tab-active')

            if (!isTabActive || isStale) {
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    console.log(`🛡️ Security: Blocking access. Reason: ${isStale ? 'Stale' : 'First Access'}`)
                    await supabase.auth.signOut()
                    document.cookie = 'session_presence=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
                    sessionStorage.clear()
                    sessionStorage.setItem('app-tab-active', 'true')
                    window.location.href = '/login'
                    return
                }
                sessionStorage.setItem('app-tab-active', 'true')
            }

            setIsChecking(false)
        }

        initSecurity()

        resetTimer()
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
        const handleActivity = () => resetTimer()
        events.forEach(e => window.addEventListener(e, handleActivity))

        const handleUnload = () => {
            // We don't clear here because we want F5/Navigate to work.
            // But we dirty the timestamp so the 3s/5s check works on reopen.
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

    if (isChecking) {
        return (
            <div className="fixed inset-0 z-[99999] bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                    <p className="text-slate-400 text-sm font-medium tracking-tight">안전한 세션 연결 중...</p>
                </div>
            </div>
        )
    }

    return null
}
