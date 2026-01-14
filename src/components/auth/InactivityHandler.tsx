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
        // Initialize the timer
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
