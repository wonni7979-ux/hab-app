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
        // --- Strict Session Sync Logic (Anti-Zombie Session) ---
        const checkSessionSync = async () => {
            // Check if this specific tab/window has an active session flag
            const isSessionActive = sessionStorage.getItem('sb-session-active')

            // If the flag is missing, it means this is a fresh window/tab.
            if (!isSessionActive) {
                // If we detect a user persisting in cookies despite being a new tab,
                // we force an immediate sign out to ensure the "logout on close" behavior.
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    console.log('🛡️ Security: Ghost session detected in fresh tab. Purging credentials...')
                    await supabase.auth.signOut()
                    // Set flag AFTER sign out to prevent infinite loop
                    sessionStorage.setItem('sb-session-active', 'checked')
                    router.refresh()
                    router.push('/login')
                    return
                }

                // Mark this specific window session as active/checked even if no session was found
                sessionStorage.setItem('sb-session-active', 'checked')
            }
        }

        checkSessionSync()

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
