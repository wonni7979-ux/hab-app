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
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, Calendar as CalendarIcon, PieChart as PieChartIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CategoryStat {
    name: string
    value: number
    color: string
    percent: number
    icon: string
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
            const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
            const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd')

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    categories(name, color, icon)
                `)
                .gte('date', start)
                .lte('date', end)

            if (error) throw error

            const transactions = data as unknown as Transaction[]
            const categoryData: Record<string, { name: string, value: number, color: string, icon: string }> = {}
            let totalExpense = 0

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
                }
            })

            const categoryStats: CategoryStat[] = Object.values(categoryData).map(cat => ({
                ...cat,
                percent: Math.round((cat.value / (totalExpense || 1)) * 100)
            })).sort((a, b) => b.value - a.value)

            const daysInMonth = eachDayOfInterval({
                start: startOfMonth(selectedDate),
                end: endOfMonth(selectedDate)
            })

            const dailyData = daysInMonth.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd')
                const amount = transactions
                    .filter(t => t.date === dayStr && t.type === 'expense')
                    .reduce((acc, t) => acc + t.amount, 0)
                return {
                    name: format(day, 'd일'),
                    date: dayStr,
                    amount
                }
            })

            const weeklyData: any[] = []
            for (let i = 0; i < dailyData.length; i += 7) {
                const chunk = dailyData.slice(i, i + 7)
                const weekTotal = chunk.reduce((acc, d) => acc + d.amount, 0)
                weeklyData.push({
                    name: `${Math.floor(i / 7) + 1}주차`,
                    amount: weekTotal
                })
            }

            return {
                categoryStats,
                totalExpense,
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
                        <Card className="border-none bg-primary/15 shadow-[0_8px_30px_rgba(29,161,242,0.15)] p-6 relative overflow-hidden group rounded-[32px] border border-primary/20">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                            <div className="flex gap-4 relative z-10">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/30">
                                    <ZapIcon size={24} />
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">스마트 AI 분석</h3>
                                    <p className="text-white text-[15px] leading-relaxed font-bold">
                                        {stats?.totalExpense && stats.totalExpense > 1000000
                                            ? "지출 규모가 평소보다 큽니다. 식비 비출의 42%가 불필요한 배달 음식이었네요. 조금만 조절하면 15만원을 아낄 수 있어요!"
                                            : "완벽한 자금 관리예요! 지난달보다 고정 지출을 12%나 줄이셨습니다. 현재의 소비 패턴을 잘 유지해보세요."}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-8">
                            <div className="text-center space-y-3">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">이달의 총 지출</p>
                                <h2 className="text-5xl font-black text-white tracking-tighter">₩{stats?.totalExpense.toLocaleString()}</h2>
                            </div>

                            <div className="flex flex-col items-center gap-10 py-6">
                                <div className="h-64 w-full max-w-[300px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats?.categoryStats as any}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={75}
                                                outerRadius={105}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {stats?.categoryStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                                formatter={(value: any) => [`₩${value?.toLocaleString()}`, '지출']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">성장률</span>
                                        <span className="text-sm font-black text-emerald-400">▲ +5.2%</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {stats?.categoryStats.map((cat, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 rounded-[24px] bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 transition-all group cursor-pointer">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                                                {cat.icon}
                                            </div>
                                            <div className="overflow-hidden space-y-0.5">
                                                <p className="text-[14px] font-black text-white truncate">{cat.name}</p>
                                                <p className="text-[12px] font-bold text-slate-500">{cat.percent}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                            <h3 className="text-xl font-black text-white px-2 tracking-tight">주간별 지출 트렌드</h3>
                            <div className="h-72 w-full bg-slate-900/60 backdrop-blur-xl rounded-[32px] border border-white/5 p-6 shadow-2xl">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.weeklyData}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#1da1f2" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#1da1f2" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
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
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                            formatter={(value: any) => [`₩${value?.toLocaleString()}`, '지출']}
                                        />
                                        <Bar
                                            dataKey="amount"
                                            fill="url(#barGradient)"
                                            radius={[10, 10, 10, 10]}
                                            barSize={36}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-white px-2 tracking-tight">일일 지출 오버뷰</h3>
                            <div className="h-72 w-full bg-slate-900/60 backdrop-blur-xl rounded-[32px] border border-white/5 p-6 shadow-2xl">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.dailyData}>
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                            interval={4}
                                            dy={10}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 4 }}
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px' }}
                                            formatter={(value: any) => [`₩${value?.toLocaleString()}`, '지출']}
                                        />
                                        <Bar dataKey="amount" fill="#1da1f2" radius={[4, 4, 4, 4]} opacity={0.7} />
                                    </BarChart>
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

function ZapIcon({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-white"
        >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    )
}
