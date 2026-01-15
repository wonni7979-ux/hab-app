'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PieChart, Pie, Cell } from 'recharts'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export function BudgetDonutCard() {
    const supabase = createClient()
    const [isMounted, setIsMounted] = useState(false)
    const now = new Date()
    const yearMonth = format(now, 'yyyy-MM')

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const { data: budgetData, isLoading } = useQuery({
        queryKey: ['budget-donut', yearMonth],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null

            // Get budget
            const { data: budget } = await supabase
                .from('budgets')
                .select('total_budget')
                .eq('user_id', user.id)
                .eq('year_month', yearMonth)
                .maybeSingle()

            // Get current month expense
            const start = startOfMonth(now).toISOString()
            const end = endOfMonth(now).toISOString()
            const { data: transactions } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .gte('date', start)
                .lte('date', end)

            const totalBudget = budget?.total_budget || 0
            const totalSpent = transactions?.reduce((acc, t) => acc + t.amount, 0) || 0

            return { totalBudget, totalSpent }
        }
    })

    if (isLoading || !budgetData) return (
        <Card className="mx-6 border-none bg-slate-900/40 shadow-xl backdrop-blur-sm overflow-hidden h-32 animate-pulse" />
    )

    const { totalBudget, totalSpent } = budgetData
    const spentPercent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0
    const remaining = totalBudget - totalSpent

    const data = [
        { name: '사용', value: spentPercent },
        { name: '남음', value: Math.max(0, 100 - spentPercent) },
    ]
    const COLORS = [spentPercent > 100 ? '#f43f5e' : '#1da1f2', '#334155']

    return (
        <Card className="mx-6 border-none bg-slate-900/40 shadow-xl backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 flex items-center gap-6">
                <div className="relative h-24 w-24 flex-shrink-0" style={{ minWidth: '96px', minHeight: '96px' }}>
                    {isMounted && (
                        <PieChart width={96} height={96} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={45}
                                paddingAngle={0}
                                dataKey="value"
                                stroke="none"
                                startAngle={90}
                                endAngle={-270}
                                isAnimationActive={false}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-white leading-none">{spentPercent}%</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">사용</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-[17px] font-bold text-white tracking-tight">
                        {remaining < 0 ? '예산 초과' : '남은 예산'}: {Math.abs(remaining).toLocaleString()}원
                    </h3>
                    <p className="text-xs font-bold text-slate-500">
                        총예산: {totalBudget.toLocaleString()}원
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
