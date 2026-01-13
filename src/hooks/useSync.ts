'use client'

import { useEffect } from 'react'
import { useTransactionStore } from '@/lib/stores/useTransactionStore'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export function useSync() {
    const { syncPending } = useTransactionStore()
    const queryClient = useQueryClient()
    const supabase = createClient()

    // 온라인/오프라인 감지 및 동기화
    useEffect(() => {
        const handleOnline = () => {
            syncPending()
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
        }

        window.addEventListener('online', handleOnline)
        return () => window.removeEventListener('online', handleOnline)
    }, [syncPending, queryClient])

    // 실시간 변경 감지 (Realtime)
    useEffect(() => {
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                },
                () => {
                    queryClient.invalidateQueries()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, queryClient])
}
