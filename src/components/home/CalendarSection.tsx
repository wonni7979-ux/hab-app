'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function CalendarSection() {
    const supabase = createClient()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [view, setView] = useState<'monthly' | 'weekly' | 'daily'>('monthly')

    const days = ['일', '월', '화', '수', '목', '금', '토']

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    })

    // Fetch transactions for the current viewing month
    const { data: transactions } = useQuery({
        queryKey: ['home-calendar-transactions', format(currentDate, 'yyyy-MM')],
        queryFn: async () => {
            const start = format(calendarStart, 'yyyy-MM-dd')
            const end = format(calendarEnd, 'yyyy-MM-dd')

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    categories(name, color, icon)
                `)
                .gte('date', start)
                .lte('date', end)

            if (error) throw error
            return data
        },
    })

    // Grouping for markers and summary
    const dayStats = transactions?.reduce((acc: Record<string, { income: number, expense: number, items: any[] }>, t) => {
        const date = t.date
        if (!acc[date]) acc[date] = { income: 0, expense: 0, items: [] }
        if (t.type === 'income') acc[date].income += t.amount
        else acc[date].expense += t.amount
        acc[date].items.push(t)
        return acc
    }, {}) || {}

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
    const selectedDayData = dayStats[selectedDateStr]

    return (
        <div className="space-y-6 px-6">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Calendar Dashboard</p>
                    <h2 className="text-xl font-black text-white tracking-tight">
                        {format(currentDate, 'yyyy년 M월')}
                    </h2>
                </div>
                <div className="flex gap-1.5">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* View Switcher - Optional but kept for UI structure, logic simplified */}
            <div className="flex p-1.5 bg-slate-900/60 backdrop-blur-xl rounded-[20px] border border-white/5 shadow-inner">
                {['월간', '주간', '일간'].map((item, idx) => {
                    const v = idx === 0 ? 'monthly' : idx === 1 ? 'weekly' : 'daily'
                    const isActive = view === v
                    return (
                        <button
                            key={item}
                            onClick={() => setView(v as any)}
                            className={cn(
                                "flex-1 py-2.5 text-xs font-black rounded-[14px] transition-all duration-300",
                                isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {item}
                        </button>
                    )
                })}
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md rounded-[32px] border border-white/5 p-5 shadow-2xl relative overflow-hidden group">
                <div className="grid grid-cols-7 gap-y-1 text-center relative z-10">
                    {days.map(day => (
                        <span key={day} className="text-[10px] font-black text-slate-600 uppercase tracking-widest pb-3">{day}</span>
                    ))}
                    {calendarDays.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const stats = dayStats[dateStr]
                        const isToday = isSameDay(day, new Date())
                        const isSelected = isSameDay(day, selectedDate)
                        const isInCurrentMonth = isSameMonth(day, monthStart)

                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    "flex flex-col items-center justify-center relative h-12 w-full rounded-2xl transition-all duration-300 group/day",
                                    !isInCurrentMonth && "opacity-20 pointer-events-none",
                                    isSelected && "bg-primary/20 ring-1 ring-primary/40",
                                    !isSelected && "hover:bg-white/5"
                                )}
                            >
                                <span className={cn(
                                    "text-[13px] font-black z-10",
                                    isToday && !isSelected ? "text-primary bg-primary/10 px-1.5 rounded-md" : (isSelected ? "text-white" : "text-slate-400")
                                )}>
                                    {format(day, 'd')}
                                </span>

                                <div className="flex gap-0.5 mt-1">
                                    {stats?.expense > 0 && (
                                        <div className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                                    )}
                                    {stats?.income > 0 && (
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                    )}
                                </div>
                                {isSelected && (
                                    <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Selected Day Overview */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[13px] font-black text-white">
                        {format(selectedDate, 'M월 d일 EEEE', { locale: ko })}
                    </h3>
                    <div className="text-right">
                        {selectedDayData ? (
                            <p className="text-[13px] font-black text-primary">
                                {selectedDayData.expense > 0 ? `-${selectedDayData.expense.toLocaleString()}원` : `+${selectedDayData.income.toLocaleString()}원`}
                            </p>
                        ) : (
                            <p className="text-[11px] font-bold text-slate-600">내역 없음</p>
                        )}
                    </div>
                </div>

                {selectedDayData && selectedDayData.items.length > 0 ? (
                    <div className="space-y-2">
                        {selectedDayData.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-2xl border border-white/5 group hover:bg-slate-900/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                        style={{ backgroundColor: `${item.categories?.color}15`, color: item.categories?.color }}
                                    >
                                        {item.categories?.icon || '📦'}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-black text-white truncate max-w-[120px]">
                                            {item.description || item.categories?.name}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.categories?.name}</p>
                                    </div>
                                </div>
                                <p className={cn(
                                    "text-[14px] font-black",
                                    item.type === 'expense' ? "text-white" : "text-emerald-400"
                                )}>
                                    {item.type === 'expense' ? '-' : '+'}{item.amount.toLocaleString()}원
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 bg-slate-900/20 rounded-[32px] border border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800/30 flex items-center justify-center text-slate-700">
                            <Wallet size={20} />
                        </div>
                        <p className="text-[11px] font-bold text-slate-600">이날은 지출 기록이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
