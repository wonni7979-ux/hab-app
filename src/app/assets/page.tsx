'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Wallet, CreditCard, Landmark, Plus, MinusCircle, Wallet2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PaymentMethod {
    id: string
    name: string
    initial_balance: number
}

interface Transaction {
    amount: number
    type: string
    payment_method_id: string
    to_payment_method_id: string | null
}

export default function AssetsPage() {
    const supabase = createClient()

    const { data: methods, isLoading: mLoading } = useQuery({
        queryKey: ['payment_methods'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return []
            const { data, error } = await supabase.from('payment_methods').select('*').eq('user_id', user.id).order('name')
            if (error) throw error
            return data as PaymentMethod[]
        }
    })

    const { data: txs, isLoading: tLoading } = useQuery({
        queryKey: ['transactions-all'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return []
            const { data: txs, error: tError } = await supabase
                .from('transactions')
                .select('type, amount, payment_method_id, to_payment_method_id')
                .eq('user_id', user.id)
            if (tError) throw tError
            return txs as Transaction[]
        }
    })

    if (mLoading || tLoading) return <div className="p-8 text-center text-muted-foreground">불러오는 중...</div>

    const methodBalances = (methods || []).map(m => {
        let balance = m.initial_balance || 0
        txs?.forEach(t => {
            if (t.type === 'income' && t.payment_method_id === m.id) {
                balance += t.amount
            } else if (t.type === 'expense' && t.payment_method_id === m.id) {
                balance -= t.amount
            } else if (t.type === 'transfer') {
                if (t.payment_method_id === m.id) balance -= t.amount
                if (t.to_payment_method_id === m.id) balance += t.amount
            }
        })
        return { ...m, balance }
    })

    const totalAssets = methodBalances.reduce((acc, m) => acc + m.balance, 0)

    // Split into Assets and Liabilities
    const assetAccounts = methodBalances.filter(m => m.balance >= 0)
    const liabilityAccounts = methodBalances.filter(m => m.balance < 0)

    const totalAssetSum = assetAccounts.reduce((acc, m) => acc + m.balance, 0)
    const totalLiabilitySum = Math.abs(liabilityAccounts.reduce((acc, m) => acc + m.balance, 0))

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            <header className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <ArrowLeft className="text-white" size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-white">자산 현황</h1>
                </div>
            </header>

            <div className="px-6 space-y-8">
                {/* Total Summary */}
                <Card className="border-none bg-primary/10 shadow-xl overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <CardContent className="p-6 space-y-4 relative">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">순자산 합계</p>
                            <h2 className="text-3xl font-black text-white tracking-tight">
                                {totalAssets.toLocaleString()}원
                            </h2>
                        </div>
                        <div className="flex gap-4 pt-2 border-t border-white/5">
                            <div className="flex-1 space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">총 자산</p>
                                <p className="text-sm font-black text-emerald-400">+{totalAssetSum.toLocaleString()}원</p>
                            </div>
                            <div className="flex-1 space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">총 부채</p>
                                <p className="text-sm font-black text-rose-500">-{totalLiabilitySum.toLocaleString()}원</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assets Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Plus size={14} /> 자산 계정
                    </h3>
                    <div className="grid gap-4">
                        {assetAccounts.map((m) => (
                            <AccountCard key={m.id} account={m} isLiability={false} />
                        ))}
                        {assetAccounts.length === 0 && (
                            <p className="text-center py-8 text-slate-500 text-xs italic">등록된 자산 계정이 없습니다.</p>
                        )}
                    </div>
                </div>

                {/* Liabilities Section */}
                {liabilityAccounts.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest px-1 flex items-center gap-2">
                            <MinusCircle size={14} /> 부채 계정 (채무)
                        </h3>
                        <div className="grid gap-4">
                            {liabilityAccounts.map((m) => (
                                <AccountCard key={m.id} account={m} isLiability={true} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function AccountCard({ account, isLiability }: { account: any, isLiability: boolean }) {
    const Icon = account.name.includes('카드') ? CreditCard : account.name.includes('통장') ? Landmark : Wallet2

    return (
        <Card className={cn(
            "border-none bg-slate-900/40 shadow-lg overflow-hidden group transition-all hover:bg-slate-900/60",
            isLiability && "border-l-4 border-rose-500"
        )}>
            <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner",
                        isLiability ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-primary"
                    )}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <p className="text-[15px] font-bold text-white leading-tight">{account.name}</p>
                        <p className="text-xs font-medium text-slate-500">
                            {account.name.includes('카드') ? '결제 수단' : account.name.includes('통장') ? '입출금 계좌' : isLiability ? '상환 필요' : '자산 계정'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn(
                        "text-[16px] font-black",
                        isLiability ? "text-rose-400" : "text-white"
                    )}>
                        {account.balance.toLocaleString()}원
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
