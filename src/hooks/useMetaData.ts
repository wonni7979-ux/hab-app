'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCategories() {
    const supabase = createClient()
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name')
            if (error) throw error
            return data
        },
    })
}

export function usePaymentMethods() {
    const supabase = createClient()
    return useQuery({
        queryKey: ['payment_methods'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .order('name')
            if (error) throw error
            return data
        },
    })
}
