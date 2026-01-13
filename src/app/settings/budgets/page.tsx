'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Budget {
    id: string
    year_month: string
    total_budget: number
}

interface Transaction {
    amount: number
    type: string
    category_id: string
    categories: {
        name: string
        icon: string
        color: string
    }
}

export default function BudgetManagementPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [budgetInput, setBudgetInput] = useState('')

    const yearMonth = format(selectedDate, 'yyyy-MM')
    const displayMonth = format(selectedDate, 'yyyy년 M월')

    // 1. Fetch Budget for current month
    const { data: budget, isLoading: isBudgetLoading } = useQuery({
        queryKey: ['budget', yearMonth],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null

            const { data, error } = await supabase
                .from('budgets')
                .select('*')
                .eq('user_id', user.id)
                .eq('year_month', yearMonth)
                .maybeSingle()

            if (error) throw error
            return data as Budget | null
        }
    })

    // 2. Fetch Transactions for current month to calculate total spending
    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['budget-stats', yearMonth],
        queryFn: async () => {
            const start = startOfMonth(selectedDate).toISOString()
            const end = endOfMonth(selectedDate).toISOString()

            const { data, error } = await supabase
                .from('transactions')
                .select('amount, type, category_id, categories(name, icon, color)')
                .eq('type', 'expense')
                .gte('date', start)
                .lte('date', end)

            if (error) throw error

            const transactions = data as unknown as Transaction[]
            const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0)

            // Group by category for the list
            const categorySpent: Record<string, { name: string, icon: string, color: string, amount: number }> = {}
            transactions.forEach(t => {
                const catId = t.category_id || 'unknown'
                if (!categorySpent[catId]) {
                    categorySpent[catId] = {
                        name: t.categories?.name || '기타',
                        icon: t.categories?.icon || '📦',
                        color: t.categories?.color || '#94a3b8',
                        amount: 0
                    }
                }
                categorySpent[catId].amount += t.amount
            })

            return {
                totalSpent,
                categoryItems: Object.values(categorySpent).sort((a, b) => b.amount - a.amount)
            }
        }
    })

    const upsertMutation = useMutation({
        mutationFn: async (amount: number) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('로그인이 필요합니다.')

            const { error } = await supabase
                .from('budgets')
                .upsert({
                    user_id: user.id,
                    year_month: yearMonth,
                    total_budget: amount
                }, { onConflict: 'user_id,year_month' })

            if (error) throw error
        },
        onSuccess: () => {
            toast.success('예산이 설정되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['budget', yearMonth] })
            setIsDialogOpen(false)
        },
        onError: (err: any) => {
            toast.error('저장 실패: ' + err.message)
        }
    })

    const handleOpenDialog = () => {
        setBudgetInput(budget?.total_budget?.toString() || '0')
        setIsDialogOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const amount = parseInt(budgetInput.replace(/[^0-9]/g, ''))
        if (isNaN(amount) || amount < 0) {
            toast.error('올바른 금액을 입력하세요.')
            return
        }
        upsertMutation.mutate(amount)
    }

    const totalBudget = budget?.total_budget || 0
    const totalSpent = stats?.totalSpent || 0
    const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    const remaining = totalBudget - totalSpent
    const isOverBudget = remaining < 0

    if (isBudgetLoading || isStatsLoading) return <div className="p-8 text-center text-muted-foreground">불러오는 중...</div>

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            <header className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                    <Link href="/settings">
                        <ArrowLeft className="text-white" size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-white">예산 관리</h1>
                </div>
            </header>

            <div className="px-6 space-y-8">
                {/* Month Selector */}
                <div className="flex items-center justify-between">
                    <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="text-slate-400 p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ChevronLeft size={28} />
                    </button>
                    <h2 className="text-xl font-black text-white underline underline-offset-8 decoration-primary decoration-4">
                        {displayMonth}
                    </h2>
                    <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="text-slate-400 p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ChevronRight size={28} />
                    </button>
                </div>

                {/* Total Budgets Card */}
                <Card className={cn(
                    "border-none bg-slate-900/40 shadow-xl overflow-hidden transition-all",
                    isOverBudget && "border-2 border-rose-500/20"
                )}>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">이달의 총 예산</p>
                                <h3 className="text-3xl font-black text-white">
                                    {totalBudget.toLocaleString()}원
                                </h3>
                            </div>
                            <button
                                onClick={handleOpenDialog}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700 hover:text-white transition-all"
                            >
                                <Pencil size={14} />
                                예산 설정
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    현재 지출
                                </span>
                                <span>{totalSpent.toLocaleString()}원</span>
                            </div>
                            <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000 ease-out",
                                        isOverBudget ? "bg-rose-500" : "bg-primary"
                                    )}
                                    style={{ width: `${Math.min(100, spentPercent)}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-end pt-4 border-t border-white/5">
                            <span className="text-sm font-bold text-slate-500">
                                {isOverBudget ? '예산 초과' : '남은 예산'}
                            </span>
                            <span className={cn(
                                "text-2xl font-black",
                                isOverBudget ? "text-rose-500" : "text-emerald-400"
                            )}>
                                {isOverBudget ? `⚠️ ${Math.abs(remaining).toLocaleString()}원` : `${remaining.toLocaleString()}원`}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Budgets */}
                <div className="space-y-5">
                    <h3 className="text-lg font-black text-white px-1">카테고리별 지출 현황</h3>
                    <div className="space-y-6">
                        {stats?.categoryItems.map((item, idx) => {
                            const catPercent = totalBudget > 0 ? (item.amount / totalBudget) * 100 : 0
                            return (
                                <div key={idx} className="flex gap-4 group">
                                    <div
                                        className="h-10 w-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: `${item.color}20`, color: item.color }}
                                    >
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[15px] font-bold text-white">{item.name}</span>
                                            <span className="text-[13px] font-bold text-slate-500">
                                                {item.amount.toLocaleString()}원
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/60 transition-all duration-1000"
                                                style={{ width: `${Math.min(100, Math.max(5, catPercent))}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {(!stats?.categoryItems || stats.categoryItems.length === 0) && (
                            <p className="text-center py-12 text-slate-500 text-sm italic">지출 내역이 없습니다.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Float Action Button */}
            <button
                onClick={handleOpenDialog}
                className="fixed bottom-28 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-[0_8px_25px_rgba(29,161,242,0.4)] flex items-center justify-center active:scale-90 transition-all z-50 hover:bg-primary/90"
            >
                <Plus size={28} />
            </button>

            {/* Budget Setup Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[90vw] w-[400px] rounded-3xl bg-slate-900 border-white/5 p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">
                            {displayMonth} 예산 설정
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">목표 예산 (원)</Label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={budgetInput}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '')
                                            setBudgetInput(val)
                                        }}
                                        placeholder="금액을 입력하세요"
                                        className="bg-slate-800 border-white/5 text-white h-14 text-xl font-black rounded-2xl focus:border-primary/50 pl-10"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₩</div>
                                </div>
                                <p className="text-xs text-slate-500 px-1 italic">
                                    설정한 예산은 해당 월의 지출 관리 지표로 사용됩니다.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="flex gap-3 sm:justify-end pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="flex-1 sm:flex-none text-slate-400 font-bold h-12 rounded-xl"
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 sm:flex-none bg-primary text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20"
                                disabled={upsertMutation.isPending}
                            >
                                {upsertMutation.isPending ? '저장 중...' : '예산 저장하기'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
