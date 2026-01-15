'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, RefreshCcw, Landmark, CreditCard, Banknote } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AssetData {
    id: string
    name: string
    initial_balance: number
    income: number
    expense: number
    transfer_in: number
    transfer_out: number
    current_balance: number
}

export default function AssetsPage() {
    const supabase = createClient()

    const { data: assets, isLoading } = useQuery({
        queryKey: ['assets'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return []

            // 1. Get all payment methods
            const { data: methods, error: mError } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('user_id', user.id)
            if (mError) throw mError

            // 2. Get all transactions to calculate balances
            const { data: txs, error: tError } = await supabase
                .from('transactions')
                .select('type, amount, payment_method_id, to_payment_method_id')
                .eq('user_id', user.id)
            if (tError) throw tError

            const assetMap: Record<string, AssetData> = {}

            methods.forEach(m => {
                assetMap[m.id] = {
                    id: m.id,
                    name: m.name,
                    initial_balance: Number(m.initial_balance || 0),
                    income: 0,
                    expense: 0,
                    transfer_in: 0,
                    transfer_out: 0,
                    current_balance: Number(m.initial_balance || 0)
                }
            })

            txs.forEach(t => {
                const amount = Number(t.amount)
                if (t.type === 'income' && t.payment_method_id) {
                    if (assetMap[t.payment_method_id]) {
                        assetMap[t.payment_method_id].income += amount
                        assetMap[t.payment_method_id].current_balance += amount
                    }
                } else if (t.type === 'expense' && t.payment_method_id) {
                    if (assetMap[t.payment_method_id]) {
                        assetMap[t.payment_method_id].expense += amount
                        assetMap[t.payment_method_id].current_balance -= amount
                    }
                } else if (t.type === 'transfer') {
                    if (t.payment_method_id && assetMap[t.payment_method_id]) {
                        assetMap[t.payment_method_id].transfer_out += amount
                        assetMap[t.payment_method_id].current_balance -= amount
                    }
                    if (t.to_payment_method_id && assetMap[t.to_payment_method_id]) {
                        assetMap[t.to_payment_method_id].transfer_in += amount
                        assetMap[t.to_payment_method_id].current_balance += amount
                    }
                }
            })

            return Object.values(assetMap).sort((a, b) => b.current_balance - a.current_balance)
        }
    })

    const totalAssets = assets?.reduce((acc, a) => acc + a.current_balance, 0) || 0

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">자산 정보를 계산 중입니다...</div>

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            <header className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <ArrowLeft className="text-white" size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-white tracking-tight">자산 현항</h1>
                </div>
            </header>

            <div className="px-6 space-y-8">
                {/* Total Assets Summary */}
                <div className="relative overflow-hidden bg-slate-900 border border-white/5 p-8 rounded-[40px] shadow-2xl">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                    <div className="relative space-y-2">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">현재 총 자산</p>
                        <h2 className="text-4xl font-black text-white tracking-tighter">
                            ₩{totalAssets.toLocaleString()}
                        </h2>
                        <div className="flex items-center gap-2 pt-2">
                            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full uppercase tracking-wider">
                                Active Accounts: {assets?.length || 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Account List */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">계좌별 잔액</h3>
                    <div className="space-y-4">
                        {assets?.map((asset) => (
                            <Card key={asset.id} className="border-none bg-slate-900/40 shadow-xl overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-800 flex items-center justify-center text-primary group-hover:scale-110 transition-all shadow-inner">
                                                {asset.name.includes('카드') ? <CreditCard size={28} /> : asset.name.includes('통장') || asset.name.includes('계좌') ? <Landmark size={28} /> : <Banknote size={28} />}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[17px] font-black text-white leading-tight">{asset.name}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                                        <TrendingUp size={10} className="text-emerald-500" /> ₩{asset.income.toLocaleString()}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                                        <TrendingDown size={10} className="text-rose-500" /> ₩{asset.expense.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-white tracking-tight">
                                                ₩{asset.current_balance.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                Balance
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sub-details for Transfer */}
                                    {(asset.transfer_in > 0 || asset.transfer_out > 0) && (
                                        <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                <RefreshCcw size={10} className="text-primary" />
                                                <span>이동 입금: {asset.transfer_in.toLocaleString()}원</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                <RefreshCcw size={10} className="text-slate-600" />
                                                <span>이동 출금: {asset.transfer_out.toLocaleString()}원</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Empty State */}
                {(!assets || assets.length === 0) && (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center mx-auto text-slate-700">
                            <Wallet size={40} />
                        </div>
                        <p className="text-slate-500 font-bold">등록된 결제 수단이 없습니다.</p>
                        <Link href="/settings/payment-methods">
                            <Button className="bg-primary text-white font-bold rounded-xl mt-4">결제 수단 추가하기</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
