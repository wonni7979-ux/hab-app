'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'SECURITY'

export async function logSystemEvent(level: LogLevel, source: string, action: string, details?: any) {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        const headerList = await headers()
        const userAgent = headerList.get('user-agent') || 'Unknown'
        const ip = headerList.get('x-forwarded-for') || 'Unknown IP'

        const metadata = {
            ...details,
            userAgent,
            ip
        }

        const { error } = await supabase.from('system_logs').insert([{
            log_level: level,
            source,
            action,
            user_id: session?.user?.id || null,
            details: metadata
        }])

        if (error) {
            console.error('Failed to insert system log to DB:', error)
        }
    } catch (e) {
        console.error('Exception in logSystemEvent:', e)
    }
}
