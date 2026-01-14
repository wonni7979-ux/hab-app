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
        // --- [Expert Security] Ultimate Heartbeat Presence Signal ---
        const updatePresence = () => {
            // Set a short-lived presence cookie (25 seconds)
            // This acts as a 'Proof of Life' for the current tab.
            document.cookie = `session_presence=active; path=/; max-age=25; samesite=lax`
        }

        // Initial update
        updatePresence()

        // Update presence every 10 seconds
        const presenceInterval = setInterval(updatePresence, 10000)

        // --- [Expert Security] Strict Session & Storage Cleanup ---
        const initSecurity = async () => {
            // 1. Aggressively clear any leftover Supabase storage (LocalStorage)
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) {
                    localStorage.removeItem(key)
                }
            })

            // 2. Check for Session Storage Flag (Tab Session)
            const isTabActive = sessionStorage.getItem('app-tab-active')

            if (!isTabActive) {
                // Fresh tab session detected.
                // We check if we already have a server-side user.
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    console.log('🛡️ Security: Purging persistent ghost session...')
                    await supabase.auth.signOut()
                    // Clear presence signal immediately on logout
                    document.cookie = 'session_presence=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
                    sessionStorage.setItem('app-tab-active', 'true')
                    router.refresh()
                    router.push('/login')
                    return
                }

                // If no user, just mark the tab as active
                sessionStorage.setItem('app-tab-active', 'true')
            }

            // 3. Set/Update the 'app_session_active' guard cookie (Session-only)
            document.cookie = 'app_session_active=1; path=/; samesite=lax'
        }

        initSecurity()

        // --- Inactivity Timer Logic ---
        resetTimer()

        // List of events to monitor
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']

        const handleActivity = () => {
            resetTimer()
        }

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity)
        })

        // Cleanup
        return () => {
            clearInterval(presenceInterval)
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity)
            })
        }
    }, [])

    return null // This component doesn't render anything
}
