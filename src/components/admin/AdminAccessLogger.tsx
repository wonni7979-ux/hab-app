'use client'

import { useEffect } from 'react'
import { logSystemEvent } from '@/app/actions/logActions'
import { usePathname } from 'next/navigation'

export function AdminAccessLogger() {
    const pathname = usePathname()

    useEffect(() => {
        if (pathname) {
            logSystemEvent('SECURITY', 'admin_auth', `관리자 접근: ${pathname}`, {
                path: pathname,
                time: new Date().toISOString()
            })
        }
    }, [pathname])

    return null
}
