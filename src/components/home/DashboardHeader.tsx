'use client'

import { Bell, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function DashboardHeader() {
    const router = useRouter()
    const supabase = createClient()

    const { data: totalAssets } = useQuery({
        queryKey: ['total-assets'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return 0

            const { data: methods } = await supabase
                .from('payment_methods')
                .select('initial_balance')
                .eq('user_id', user.id)

            const { data: txs } = await supabase
                .from('transactions')
                .select('type, amount')
                .eq('user_id', user.id)

            const initial = (methods || []).reduce((acc, m) => acc + Number(m.initial_balance || 0), 0)
            const transactions = (txs || []).reduce((acc, t) => {
                if (t.type === 'income') return acc + Number(t.amount)
                if (t.type === 'expense') return acc - Number(t.amount)
                return acc
            }, 0)

            return initial + transactions
        }
    })

    return (
        <header className="flex items-center justify-between p-6 pb-2">
            <Link href="/assets" className="flex items-center gap-3 active:scale-95 transition-transform">
                <div className="h-10 w-10 border-2 border-primary/20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Wallet size={20} className="text-primary" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Assets</span>
                    <span className="text-[15px] font-bold text-slate-100 leading-tight">
                        ₩{totalAssets?.toLocaleString() || '0'}
                    </span>
                </div>
            </Link>
            <button
                onClick={() => router.push('/notifications')}
                className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
                <Bell size={24} />
                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-background"></span>
            </button>
        </header>
    )
}
