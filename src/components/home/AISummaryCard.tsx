'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format, subDays } from 'date-fns'

interface Transaction {
    amount: number
    type: string
    category_id: string
    categories: {
        name: string
    } | { name: string }[] | null
}

export function AISummaryCard() {
    const router = useRouter()
    const supabase = createClient()
    const now = new Date()
    const today = format(now, 'yyyy-MM-dd')
    const yesterday = format(subDays(now, 1), 'yyyy-MM-dd')

    const { data: summary, isLoading } = useQuery({
        queryKey: ['ai-summary'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null

            // Fetch today's transactions
            const { data: todayTxs } = await supabase
                .from('transactions')
                .select('amount, type, category_id, categories(name)')
                .eq('user_id', user.id)
                .eq('date', today)

            // Fetch yesterday's transactions
            const { data: yesterdayTxs } = await supabase
                .from('transactions')
                .select('amount, type')
                .eq('user_id', user.id)
                .eq('date', yesterday)

            const typedTodayTxs = (todayTxs || []) as unknown as Transaction[]
            const typedYesterdayTxs = (yesterdayTxs || []) as any[]

            const todayExpense = typedTodayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) || 0
            const yesterdayExpense = typedYesterdayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) || 0

            // Find top category today
            const categorySums: Record<string, number> = {}
            typedTodayTxs.filter(t => t.type === 'expense').forEach(t => {
                let name = '기타'
                if (t.categories) {
                    if (Array.isArray(t.categories)) {
                        name = t.categories[0]?.name || '기타'
                    } else {
                        name = t.categories.name || '기타'
                    }
                }
                categorySums[name] = (categorySums[name] || 0) + t.amount
            })
            const topCategory = Object.entries(categorySums).sort((a, b) => b[1] - a[1])[0]

            return {
                todayExpense,
                yesterdayExpense,
                topCategoryName: topCategory ? topCategory[0] : null,
                topCategoryAmount: topCategory ? topCategory[1] : 0
            }
        }
    })

    if (isLoading || !summary) return (
        <Card className="mx-6 border-none bg-slate-900/40 shadow-xl backdrop-blur-sm h-32 animate-pulse" />
    )

    const diff = summary.todayExpense - summary.yesterdayExpense
    const isMore = diff > 0

    let title = "오늘의 지출을 기록해보세요"
    let description = "아직 오늘 기록한 내역이 없네요."

    if (summary.todayExpense > 0) {
        if (summary.topCategoryName) {
            title = `오늘 ${summary.topCategoryName}에 ${summary.topCategoryAmount.toLocaleString()}원을 쓰셨네요`
        } else {
            title = `오늘 총 ${summary.todayExpense.toLocaleString()}원을 쓰셨네요`
        }

        if (summary.yesterdayExpense > 0) {
            description = `어제보다 ${Math.abs(diff).toLocaleString()}원 ${isMore ? '더' : '덜'} 쓰셨어요.`
        } else {
            description = "어제는 지출 기록이 없었네요."
        }
    }

    return (
        <Card className="mx-6 border-none bg-slate-900/40 shadow-xl backdrop-blur-sm group hover:bg-slate-900/60 transition-all duration-500 cursor-pointer" onClick={() => router.push('/stats')}>
            <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                    <h3 className="text-[17px] font-bold text-white leading-tight">
                        {title}
                    </h3>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-400">
                            {description}
                        </p>
                        <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                            AI 스마트 요약
                        </p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            router.push('/stats')
                        }}
                    >
                        자세히 ...
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
