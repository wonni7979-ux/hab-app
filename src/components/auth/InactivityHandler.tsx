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
    const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const [isChecking, setIsChecking] = useState(true)

    const handleLogout = async () => {
        setIsChecking(true)
        const { signout } = await import('@/app/login/actions')
        await signout()
        sessionStorage.clear()
        document.cookie = 'session_presence=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
        window.location.href = '/login'
    }

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT)
    }

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (const registration of registrations) registration.unregister()
            })
        }

        const updatePresence = () => {
            const now = Date.now().toString()
            sessionStorage.setItem('last_active_timestamp', now)
            document.cookie = `session_presence=${now}; path=/; max-age=10; samesite=lax`
        }

        const initSecurity = async () => {
            const lastActiveTime = sessionStorage.getItem('last_active_timestamp')
            const currentTime = Date.now()

            let isReload = false
            if (typeof performance !== 'undefined') {
                const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
                if (navEntry && navEntry.type === 'reload') isReload = true
            }

            // Normal Flow: 3s threshold. Reload Flow: 15s drift allowance.
            const threshold = isReload ? 15000 : 3000
            const timeGap = lastActiveTime ? currentTime - parseInt(lastActiveTime) : 0
            const isStale = lastActiveTime && (timeGap > threshold)
            const isFirstTabAccess = !sessionStorage.getItem('app-tab-active')

            if (isFirstTabAccess || isStale) {
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    console.log(`🛡️ Security Check: Failed. Stale=${isStale}, FirstAccess=${isFirstTabAccess}`)
                    const { signout } = await import('@/app/login/actions')
                    await signout()
                    sessionStorage.clear()
                    document.cookie = 'session_presence=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
                    window.location.href = '/login'
                    return
                }
                sessionStorage.setItem('app-tab-active', 'true')
            }

            updatePresence()
            presenceIntervalRef.current = setInterval(updatePresence, 2000)
            setIsChecking(false)
        }

        initSecurity()

        resetTimer()
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
        const handleActivity = () => resetTimer()
        events.forEach(e => window.addEventListener(e, handleActivity))

        return () => {
            if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current)
            if (timerRef.current) clearTimeout(timerRef.current)
            events.forEach(e => window.removeEventListener(e, handleActivity))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (isChecking) {
        return (
            <div className="fixed inset-0 z-[99999] bg-[#0b0f19] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                    <p className="text-slate-400 text-sm font-medium tracking-tight px-6 text-center">
                        보안 세션 확인 중입니다.<br />
                        잠시만 기다려 주세요.
                    </p>
                </div>
            </div>
        )
    }

    return null
}
