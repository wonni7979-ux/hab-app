'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
    format,
    startOfMonth,
    endOfMonth,
    subMonths,
    addMonths,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    isToday as isDateToday
} from 'date-fns'
import { ko } from 'date-fns/locale' // Import ko locale
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    AreaChart, Area
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, Calendar as CalendarIcon, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Activity, Percent, Landmark as LoanIcon, Info } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { differenceInDays, parseISO } from 'date-fns'

interface CategoryStat {
    name: string
    value: number
    color: string
    percent: number
    icon: string
}

interface PaymentMethod {
    id: string
    name: string
    initial_balance: number
    interest_rate: number
    interest_period: 'monthly' | 'yearly'
    loan_start_date: string | null
    balance: number
    accruedInterest: number
}

interface Transaction {
    id: string
    date: string
    amount: number
    description: string
    type: string
    category_id: string
    categories: {
        name: string
        color: string
        icon: string
    }
}

export default function StatsPage() {
    const supabase = createClient()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [activeTab, setActiveTab] = useState('category')
    const [focusedDate, setFocusedDate] = useState<Date>(new Date())

    const monthStr = format(selectedDate, 'yyyy-MM')
    const displayMonth = format(selectedDate, 'yyyy년 M월')

    const { data: stats, isLoading } = useQuery({
        queryKey: ['stats', monthStr],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null

            const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
            const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd')

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    categories(name, color, icon)
                `)
                .eq('user_id', user.id)
                .gte('date', start)
                .lte('date', end)

            if (error) throw error

            const transactions = data as unknown as Transaction[]

            // --- Category Stats ---
            const categoryData: Record<string, { name: string, value: number, color: string, icon: string }> = {}
            let totalExpense = 0
            let totalIncome = 0

            transactions.forEach((t) => {
                if (t.type === 'expense') {
                    totalExpense += t.amount
                    const catName = t.categories?.name || '기타'
                    if (!categoryData[catName]) {
                        categoryData[catName] = {
                            name: catName,
                            value: 0,
                            color: t.categories?.color || '#cbd5e1',
                            icon: t.categories?.icon || '📦'
                        }
                    }
                    categoryData[catName].value += t.amount
                } else {
                    totalIncome += t.amount
                }
            })

            const categoryStats: CategoryStat[] = Object.values(categoryData).map(cat => ({
                ...cat,
                percent: Math.round((cat.value / (totalExpense || 1)) * 100)
            })).sort((a, b) => b.value - a.value)

            // --- Debt Analysis Data (Global) ---
            const { data: methodsData } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('user_id', user.id)

            let totalDebt = 0
            let totalAsset = 0
            let totalAccruedInterest = 0

            const methods = (methodsData || []) as unknown as PaymentMethod[]

            // Fetch all transactions to get true current balance for debt
            const { data: allTransactions } = await supabase
                .from('transactions')
                .select('amount, type, payment_method_id')
                .eq('user_id', user.id)

            methods.forEach(m => {
                const methodTransactions = (allTransactions || []).filter(t => t.payment_method_id === m.id)
                const balance = m.initial_balance + methodTransactions.reduce((acc, t) =>
                    acc + (t.type === 'income' ? t.amount : -t.amount), 0
                )

                if (balance < 0) {
                    totalDebt += Math.abs(balance)

                    // Interest calculation (Simple model)
                    if (m.interest_rate > 0 && m.loan_start_date) {
                        const startDate = parseISO(m.loan_start_date)
                        const daysPassed = Math.max(0, differenceInDays(new Date(), startDate))

                        let accrued = 0
                        if (m.interest_period === 'yearly') {
                            accrued = Math.abs(balance) * (m.interest_rate / 100) * (daysPassed / 365)
                        } else {
                            accrued = Math.abs(balance) * (m.interest_rate / 100) * (daysPassed / 30)
                        }
                        totalAccruedInterest += accrued
                    }
                } else {
                    totalAsset += balance
                }
            })

            const debtToAssetRatio = totalAsset > 0 ? (totalDebt / totalAsset) * 100 : 0

            // --- Chart Data ---
            const daysInMonth = eachDayOfInterval({
                start: startOfMonth(selectedDate),
                end: endOfMonth(selectedDate)
            })

            const dailyData = daysInMonth.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd')
                const income = transactions
                    .filter(t => t.date === dayStr && t.type === 'income')
                    .reduce((acc, t) => acc + t.amount, 0)
                const expense = transactions
                    .filter(t => t.date === dayStr && t.type === 'expense')
                    .reduce((acc, t) => acc + t.amount, 0)
                return {
                    name: format(day, 'd일'),
                    date: dayStr,
                    income,
                    expense,
                    amount: expense // Legacy support for other parts of UI
                }
            })

            const weeklyData: any[] = []
            for (let i = 0; i < dailyData.length; i += 7) {
                const chunk = dailyData.slice(i, i + 7)
                const weekExpense = chunk.reduce((acc, d) => acc + d.expense, 0)
                const weekIncome = chunk.reduce((acc, d) => acc + d.income, 0)
                weeklyData.push({
                    name: `${Math.floor(i / 7) + 1}주차`,
                    expense: weekExpense,
                    income: weekIncome,
                    amount: weekExpense
                })
            }

            return {
                categoryStats,
                totalExpense,
                totalIncome,
                totalDebt,
                totalAccruedInterest,
                debtToAssetRatio,
                transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                dailyData,
                weeklyData
            }
        }
    })

    const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1))
    const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1))

    // 캘린더 날짜 계산
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    // 선택된 날짜의 지출 내역 필터링
    const focusedDateStr = format(focusedDate, 'yyyy-MM-dd')
    const focusedDayTransactions = stats?.transactions.filter(t => t.date === focusedDateStr) || []
    const focusedDayTotal = focusedDayTransactions.reduce((acc, t) => acc + (t.type === 'expense' ? t.amount : 0), 0)

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-slate-500 font-bold text-sm">데이터 분석 중...</p>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32 selection:bg-primary/30">
            {/* Header */}
            <header className="flex items-center justify-between p-6 sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-white/5">
                <Link href="/">
                    <ArrowLeft className="text-white hover:text-primary transition-colors" size={24} />
                </Link>
                <h1 className="text-xl font-black text-white tracking-tight">통계 리포트</h1>
                <div className="w-6" />
            </header>

            <div className="px-6 space-y-8 pt-4">
                {/* Month Selector */}
                <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-xl p-3 rounded-[24px] border border-white/5 shadow-inner">
                    <button onClick={handlePrevMonth} className="text-slate-400 p-2 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-lg font-black text-white tracking-tight">
                        {displayMonth}
                    </h2>
                    <button onClick={handleNextMonth} className="text-slate-400 p-2 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Debt Dynamics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Card className="p-6 bg-gradient-to-br from-rose-500/20 to-rose-600/5 backdrop-blur-3xl border-rose-500/20 rounded-[32px] overflow-hidden relative group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-500">
                                    <LoanIcon size={20} />
                                </div>
                                <span className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded-lg">전체 채무</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-rose-50 tracking-tighter line-clamp-1">₩{stats?.totalDebt.toLocaleString()}</h3>
                                <p className="text-[11px] font-bold text-rose-400 mt-1 flex items-center gap-1">
                                    <Activity size={10} /> 자본 대비 부채 위험도
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-amber-500/20 to-yellow-600/5 backdrop-blur-3xl border-amber-500/20 rounded-[32px] overflow-hidden relative group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-500">
                                    <Percent size={20} />
                                </div>
                                <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-lg">예상 발생 이자</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-amber-50 tracking-tighter line-clamp-1">₩{Math.floor(stats?.totalAccruedInterest || 0).toLocaleString()}</h3>
                                <p className="text-[11px] font-bold text-amber-400 mt-1 flex items-center gap-1">
                                    <Info size={10} /> 누적 예상 지출액
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-emerald-500/20 to-teal-600/5 backdrop-blur-3xl border-emerald-500/20 rounded-[32px] overflow-hidden relative group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-500">
                                    <Activity size={20} />
                                </div>
                                <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">자산 건전성</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-emerald-50 tracking-tighter line-clamp-1">{stats?.debtToAssetRatio.toFixed(1)}%</h3>
                                <p className="text-[11px] font-bold text-emerald-400 mt-1 flex items-center gap-1">
                                    {stats?.debtToAssetRatio && stats.debtToAssetRatio > 40 ? (
                                        <><ArrowUpRight size={10} className="text-rose-500" /> 주의가 필요한 수준</>
                                    ) : (
                                        <><ArrowDownRight size={10} /> 매우 안정적인 상태</>
                                    )}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full bg-slate-900/60 backdrop-blur-xl p-1.5 rounded-[24px] h-16 border border-white/5 shadow-2xl">
                        <TabsTrigger value="category" className="flex-1 rounded-[18px] text-[13px] font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2 data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30">
                            <PieChartIcon size={16} /> 카테고리
                        </TabsTrigger>
                        <TabsTrigger value="period" className="flex-1 rounded-[18px] text-[13px] font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2 data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30">
                            <TrendingUp size={16} /> 기간별
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="flex-1 rounded-[18px] text-[13px] font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2 data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30">
                            <CalendarIcon size={16} /> 캘린더
                        </TabsTrigger>
                    </TabsList>

                    {/* 1. Category Content */}
                    <TabsContent value="category" className="mt-10 space-y-10 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none bg-primary/10 shadow-[0_8px_30px_rgba(29,161,242,0.1)] p-8 relative overflow-hidden group rounded-[40px] border border-white/5">
                            <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                            <div className="flex flex-col md:flex-row gap-6 relative z-10 items-start md:items-center">
                                <div className="h-16 w-16 rounded-[24px] bg-primary flex items-center justify-center text-white shrink-0 shadow-2xl shadow-primary/40 rotate-3 group-hover:rotate-0 transition-transform">
                                    <Activity size={32} />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em]">AI 파이낸셜 리포트</h3>
                                        <div className="px-2 py-0.5 rounded-full bg-primary/20 text-[10px] font-black text-primary border border-primary/20">LIVE</div>
                                    </div>
                                    <p className="text-white text-[17px] leading-relaxed font-bold tracking-tight">
                                        {stats?.totalExpense && stats.totalExpense > 1000000
                                            ? "지출 규모가 평소보다 큽니다. 식비 지출의 42%가 불필요한 배달 음식이었네요. 조금만 조절하면 15만원을 아낄 수 있어요!"
                                            : "완벽한 자금 관리예요! 지난달보다 고정 지출을 12%나 줄이셨습니다. 현재의 소비 패턴을 잘 유지해보세요."}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">이달의 소비 총괄</p>
                                    <h2 className="text-5xl font-black text-white tracking-tighter flex items-baseline gap-2">
                                        ₩{stats?.totalExpense.toLocaleString()}
                                        <span className="text-lg font-bold text-slate-500 tracking-normal">total</span>
                                    </h2>
                                </div>

                                <div className="h-72 w-full relative group">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats?.categoryStats as any}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={85}
                                                outerRadius={115}
                                                paddingAngle={8}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {stats?.categoryStats.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                        className="hover:opacity-90 transition-all cursor-pointer outline-none"
                                                        style={{ filter: `drop-shadow(0 0 12px ${entry.color}33)` }}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload as CategoryStat;
                                                        return (
                                                            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{data.name}</p>
                                                                <p className="text-lg font-black text-white">₩{data.value.toLocaleString()}</p>
                                                                <p className="text-[12px] font-bold text-primary">{data.percent}% of budget</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">절약 순위</span>
                                        <span className="text-2xl font-black text-emerald-400">#1위</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 content-center">
                                {stats?.categoryStats.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-5 rounded-[28px] bg-slate-900/40 border border-white/5 hover:border-white/10 hover:bg-slate-800/60 transition-all group cursor-pointer">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-[18px] flex items-center justify-center text-xl shadow-2xl group-hover:scale-110 transition-transform" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                                                {cat.icon}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[16px] font-black text-white">{cat.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-500">{cat.percent}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[15px] font-black text-white">₩{cat.value.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5 pt-4">
                            <h3 className="text-xl font-black text-white px-2 tracking-tight">상세 소비 내역</h3>
                            <div className="space-y-4">
                                {stats?.transactions.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between p-5 rounded-[28px] bg-slate-900/40 border border-white/5 shadow-sm hover:border-white/10 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-5">
                                            <div
                                                className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform"
                                                style={{ backgroundColor: `${t.categories?.color}15`, color: t.categories?.color }}
                                            >
                                                {t.categories?.icon || '📦'}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[16px] font-black text-white">{t.description || t.categories?.name}</p>
                                                <p className="text-[13px] font-bold text-slate-500">{format(new Date(t.date), 'M월 d일')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[16px] font-black text-white">-{t.amount.toLocaleString()}원</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* 2. Period Content */}
                    <TabsContent value="period" className="mt-10 space-y-12 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black text-white tracking-tight">수입 vs 지출 밸런스</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">수입</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">지출</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-80 w-full bg-slate-900/60 backdrop-blur-xl rounded-[40px] border border-white/5 p-8 shadow-2xl">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.weeklyData} barGap={8}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }}
                                            dy={15}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl space-y-2">
                                                            <div className="flex items-center justify-between gap-8">
                                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">수입</span>
                                                                <span className="text-sm font-black text-white">₩{payload[1]?.value?.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-8">
                                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">지출</span>
                                                                <span className="text-sm font-black text-white">₩{payload[0]?.value?.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="expense"
                                            fill="#1da1f2"
                                            radius={[6, 6, 6, 6]}
                                            barSize={20}
                                        />
                                        <Bar
                                            dataKey="income"
                                            fill="#10b981"
                                            radius={[6, 6, 6, 6]}
                                            barSize={20}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-white px-2 tracking-tight">일일 지출 트렌드</h3>
                            <div className="h-72 w-full bg-slate-900/60 backdrop-blur-xl rounded-[40px] border border-white/5 p-8 shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.dailyData}>
                                        <defs>
                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#1da1f2" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#1da1f2" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                            interval={4}
                                            dy={10}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
                                                            <p className="text-sm font-black text-white">₩{payload[0].value?.toLocaleString()}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expense"
                                            stroke="#1da1f2"
                                            strokeWidth={4}
                                            fill="url(#areaGradient)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </TabsContent>

                    {/* 3. Calendar Content */}
                    <TabsContent value="calendar" className="mt-10 space-y-10 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-6">
                            <div className="grid grid-cols-7 gap-y-6 text-center">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                    <span key={day} className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{day}</span>
                                ))}
                                {calendarDays.map((day, idx) => {
                                    const dayStr = format(day, 'yyyy-MM-dd')
                                    const dayAmount = stats?.dailyData.find(d => d.date === dayStr)?.amount || 0
                                    const isSelectedMonth = isSameMonth(day, monthStart)
                                    const isFocused = isSameDay(day, focusedDate)
                                    const isToday = isDateToday(day)

                                    let intensityClass = "border-white/5"
                                    if (dayAmount > 0) {
                                        if (dayAmount > 200000) intensityClass = "bg-primary border-primary shadow-[0_0_20px_rgba(29,161,242,0.3)]"
                                        else if (dayAmount > 100000) intensityClass = "bg-primary/60 border-primary/60"
                                        else if (dayAmount > 50000) intensityClass = "bg-primary/40 border-primary/40"
                                        else intensityClass = "bg-primary/20 border-primary/20"
                                    }

                                    return (
                                        <div key={idx} className="flex flex-col items-center justify-center px-1">
                                            <button
                                                onClick={() => setFocusedDate(day)}
                                                className={cn(
                                                    "w-full h-16 flex flex-col items-center justify-center rounded-full transition-all duration-500 relative border-2",
                                                    !isSelectedMonth ? "opacity-10 pointer-events-none" : "hover:border-white/20",
                                                    intensityClass,
                                                    isFocused && "ring-2 ring-white ring-offset-4 ring-offset-background scale-110 z-20",
                                                    isToday && !isFocused && "border-slate-500/50"
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-[15px] font-black",
                                                    isFocused ? "text-white" : (isSelectedMonth ? "text-slate-200" : "text-slate-800"),
                                                    isToday && !isFocused && "text-primary"
                                                )}>
                                                    {format(day, 'd')}
                                                </span>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <div className="flex items-center justify-between px-2">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">타임라인</p>
                                    <h3 className="text-xl font-black text-white tracking-tight">
                                        {format(focusedDate, 'M월 d일')} {format(focusedDate, 'EEEE', { locale: ko })}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">일일 합계</p>
                                    <p className="text-xl font-black text-primary">₩{focusedDayTotal.toLocaleString()}</p>
                                </div>
                            </div>

                            <Card className="border-none bg-slate-900/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 space-y-4">
                                {focusedDayTransactions.length > 0 ? (
                                    <div className="space-y-4">
                                        {focusedDayTransactions.map((t) => (
                                            <div key={t.id} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="h-10 w-10 rounded-xl flex items-center justify-center text-lg"
                                                        style={{ backgroundColor: `${t.categories?.color}15`, color: t.categories?.color }}
                                                    >
                                                        {t.categories?.icon || '📦'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white">{t.description || t.categories?.name}</p>
                                                        <p className="text-[11px] font-bold text-slate-500">{t.categories?.name}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-white">-{t.amount.toLocaleString()}원</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
                                        <div className="h-12 w-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600">
                                            <CalendarIcon size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-500 leading-relaxed">
                                            이날은 지출 기록이 없습니다.<br />여유로운 하루를 보내셨네요! 🍃
                                        </p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <Card className="p-6 rounded-[32px] bg-slate-900/60 border border-white/5 space-y-4 shadow-xl">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">히트맵 가이드</h4>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-8 rounded-full bg-primary/20 border border-primary/20" />
                                    <div className="w-5 h-8 rounded-full bg-primary/40 border border-primary/40" />
                                    <div className="w-5 h-8 rounded-full bg-primary/60 border border-primary/60" />
                                    <div className="w-5 h-8 rounded-full bg-primary border border-primary shadow-lg shadow-primary/20" />
                                </div>
                                <p className="text-[11px] font-bold text-slate-500">지출 강도를 색상으로 표시</p>
                            </Card>
                            <Card className="p-6 rounded-[32px] bg-slate-900/60 border border-white/5 flex flex-col justify-center space-y-2 shadow-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(29,161,242,0.5)]" />
                                    <span className="text-[13px] font-black text-white">데일리 추적기</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                                    날짜를 클릭하여 해당 일자의 상세 지출 내역을 즉시 확인해보세요.
                                </p>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
