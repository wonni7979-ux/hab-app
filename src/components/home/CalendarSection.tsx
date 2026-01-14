'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Wallet, Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    format,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function CalendarSection() {
    const supabase = createClient()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [view, setView] = useState<'monthly' | 'weekly' | 'daily'>('monthly')

    const days = ['일', '월', '화', '수', '목', '금', '토']

    // Calculate displayed days based on view
    const calendarDays = useMemo(() => {
        if (view === 'monthly') {
            const monthStart = startOfMonth(currentDate)
            const monthEnd = endOfMonth(monthStart)
            return eachDayOfInterval({
                start: startOfWeek(monthStart),
                end: endOfWeek(monthEnd),
            })
        } else if (view === 'weekly') {
            return eachDayOfInterval({
                start: startOfWeek(currentDate),
                end: endOfWeek(currentDate),
            })
        } else {
            // Daily view: only the current date
            return [currentDate]
        }
    }, [currentDate, view])

    // Fetch transactions
    const { data: transactions } = useQuery({
        queryKey: ['home-calendar-transactions', format(currentDate, 'yyyy-MM-dd'), view],
        queryFn: async () => {
            const start = format(calendarDays[0], 'yyyy-MM-dd')
            const end = format(calendarDays[calendarDays.length - 1], 'yyyy-MM-dd')

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

    // Navigation logic
    const handlePrev = () => {
        if (view === 'monthly') setCurrentDate(subMonths(currentDate, 1))
        else if (view === 'weekly') setCurrentDate(subWeeks(currentDate, 1))
        else setCurrentDate(subDays(currentDate, 1))
    }

    const handleNext = () => {
        if (view === 'monthly') setCurrentDate(addMonths(currentDate, 1))
        else if (view === 'weekly') setCurrentDate(addWeeks(currentDate, 1))
        else setCurrentDate(addDays(currentDate, 1))
    }

    const headerText = view === 'monthly'
        ? format(currentDate, 'yyyy년 M월')
        : view === 'weekly'
            ? `${format(startOfWeek(currentDate), 'M월 d일')} - ${format(endOfWeek(currentDate), 'M월 d일')}`
            : format(currentDate, 'yyyy년 M월 d일')

    return (
        <div className="space-y-6 px-6">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Dashboard View</p>
                    <h2 className="text-xl font-black text-white tracking-tight min-w-[120px]">
                        {headerText}
                    </h2>
                </div>
                <div className="flex gap-1.5">
                    <button onClick={handlePrev} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleNext} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="flex p-1.5 bg-slate-900/60 backdrop-blur-xl rounded-[20px] border border-white/5 shadow-inner">
                {['월간', '주간', '일간'].map((item, idx) => {
                    const v = idx === 0 ? 'monthly' : idx === 1 ? 'weekly' : 'daily'
                    const isActive = view === v
                    return (
                        <button
                            key={item}
                            onClick={() => {
                                setView(v as any)
                                // Optional: Reset currentDate to today when switching views?
                                // setCurrentDate(new Date())
                            }}
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

            <div className={cn(
                "bg-slate-900/40 backdrop-blur-md rounded-[32px] border border-white/5 p-5 shadow-2xl relative overflow-hidden transition-all duration-500",
                view === 'daily' ? "h-32 flex items-center justify-center" : "min-h-[200px]"
            )}>
                <div className={cn(
                    "grid gap-y-1 text-center relative z-10 w-full",
                    view === 'daily' ? "grid-cols-1" : "grid-cols-7"
                )}>
                    {view !== 'daily' && days.map(day => (
                        <span key={day} className="text-[10px] font-black text-slate-600 uppercase tracking-widest pb-3">{day}</span>
                    ))}
                    {calendarDays.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const stats = dayStats[dateStr]
                        const isToday = isSameDay(day, new Date())
                        const isSelected = isSameDay(day, selectedDate)
                        const isInMonth = isSameMonth(day, currentDate)

                        if (view === 'daily') {
                            return (
                                <div key={idx} className="flex flex-col items-center justify-center space-y-2">
                                    <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
                                        <span className="text-2xl font-black text-white">{format(day, 'd')}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 capitalize">{format(day, 'EEEE', { locale: ko })}</p>
                                </div>
                            )
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setSelectedDate(day)
                                    if (view === 'weekly') setCurrentDate(day) // Keep focus
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center relative h-12 w-full rounded-2xl transition-all duration-300 group/day",
                                    view === 'monthly' && !isInMonth && "opacity-20 pointer-events-none",
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
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={14} className="text-primary" />
                        <h3 className="text-[13px] font-black text-white">
                            {format(view === 'daily' ? currentDate : selectedDate, 'M월 d일 EEEE', { locale: ko })}
                        </h3>
                    </div>
                    <div className="text-right">
                        {(view === 'daily' ? dayStats[format(currentDate, 'yyyy-MM-dd')] : selectedDayData) ? (
                            <p className="text-[13px] font-black text-primary">
                                {((view === 'daily' ? dayStats[format(currentDate, 'yyyy-MM-dd')] : selectedDayData)?.expense || 0) > 0
                                    ? `-${(view === 'daily' ? dayStats[format(currentDate, 'yyyy-MM-dd')] : selectedDayData).expense.toLocaleString()}원`
                                    : `+${(view === 'daily' ? dayStats[format(currentDate, 'yyyy-MM-dd')] : selectedDayData).income.toLocaleString()}원`}
                            </p>
                        ) : (
                            <p className="text-[11px] font-bold text-slate-600">내역 없음</p>
                        )}
                    </div>
                </div>

                {/* Displaying Items for the selected/current day */}
                {((view === 'daily' ? dayStats[format(currentDate, 'yyyy-MM-dd')] : selectedDayData)?.items.length || 0) > 0 ? (
                    <div className="space-y-2">
                        {(view === 'daily' ? dayStats[format(currentDate, 'yyyy-MM-dd')] : selectedDayData).items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-2xl border border-white/5 group hover:bg-slate-900/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner"
                                        style={{ backgroundColor: `${item.categories?.color}15`, color: item.categories?.color }}
                                    >
                                        {item.categories?.icon || '📦'}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-black text-white truncate max-w-[150px]">
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
                    <div className="py-12 bg-slate-900/20 rounded-[32px] border border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-800/30 flex items-center justify-center text-slate-700">
                            <Wallet size={24} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[12px] font-bold text-slate-500">이날은 지출 기록이 없습니다.</p>
                            <p className="text-[10px] text-slate-600 font-medium">새로운 내역을 추가해 보세요!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
