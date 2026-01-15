'use client'

import { useState } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowUpCircle, ArrowDownCircle, Filter, Search } from 'lucide-react'
import Link from 'next/link'
import { TransactionList } from '@/components/transactions/TransactionList'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function HistoryPage() {
    const supabase = createClient()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [searchQuery, setSearchQuery] = useState('')
    const [filterPeriod, setFilterPeriod] = useState<'1month' | '3months' | '6months' | '1year' | 'all'>('1month')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const monthStr = format(selectedDate, 'yyyy-MM')

    const { data: monthSummary, refetch: refetchSummary } = useQuery({
        queryKey: ['month-summary', monthStr, filterPeriod],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { income: 0, expense: 0 }

            let query = supabase
                .from('transactions')
                .select('amount, type, date')
                .eq('user_id', user.id)

            if (filterPeriod !== '1month') {
                const now = new Date()
                let startDate = new Date()
                if (filterPeriod === '3months') startDate.setMonth(now.getMonth() - 3)
                else if (filterPeriod === '6months') startDate.setMonth(now.getMonth() - 6)
                else if (filterPeriod === '1year') startDate.setFullYear(now.getFullYear() - 1)
                else if (filterPeriod === 'all') startDate = new Date(1900, 0, 1)

                query = query.gte('date', format(startDate, 'yyyy-MM-dd'))
            } else {
                const start = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), 'yyyy-MM-dd')
                const end = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), 'yyyy-MM-dd')
                query = query.gte('date', start).lte('date', end)
            }

            const { data, error } = await query

            if (error) throw error

            return data.reduce((acc, t) => {
                if (t.type === 'expense') acc.expense += t.amount
                else if (t.type === 'income') acc.income += t.amount
                return acc
            }, { income: 0, expense: 0 })
        }
    })

    const handlePrevMonth = () => {
        setSelectedDate(subMonths(selectedDate, 1))
        setFilterPeriod('1month')
    }
    const handleNextMonth = () => {
        setSelectedDate(addMonths(selectedDate, 1))
        setFilterPeriod('1month')
    }

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            {/* Header */}
            <header className="flex items-center justify-between p-6 sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-white/5">
                <Link href="/">
                    <div className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="text-white" size={24} />
                    </div>
                </Link>
                <h1 className="text-xl font-black text-white tracking-tight">전체 내역</h1>
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={cn(
                        "p-2 rounded-full transition-colors",
                        isFilterOpen ? "bg-primary text-white" : "text-slate-500 hover:bg-white/5"
                    )}
                >
                    <Filter size={24} />
                </button>
            </header>

            <div className="px-6 space-y-6 pt-4">
                {/* Search & Filter Bar */}
                {isFilterOpen && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <Input
                                placeholder="검색 또는 카테고리 (예: 급여, 식비)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-900 border-white/5 text-white h-12 pl-12 rounded-2xl focus:border-primary/50"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {[
                                { id: '1month', label: '1개월' },
                                { id: '3months', label: '3개월' },
                                { id: '6months', label: '6개월' },
                                { id: '1year', label: '1년' },
                                { id: 'all', label: '전체' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setFilterPeriod(p.id as any)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                                        filterPeriod === p.id
                                            ? "bg-white text-slate-900 shadow-lg"
                                            : "bg-slate-900 text-slate-500 border border-white/5"
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Month Selector (Only show if 1 month is selected) */}
                {filterPeriod === '1month' && (
                    <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-xl p-3 rounded-[24px] border border-white/5 shadow-inner">
                        <button onClick={handlePrevMonth} className="text-slate-400 p-2 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                            <ChevronLeft size={24} />
                        </button>
                        <div className="text-center">
                            <h2 className="text-lg font-black text-white tracking-tight leading-tight">
                                {format(selectedDate, 'yyyy년 M월')}
                            </h2>
                        </div>
                        <button onClick={handleNextMonth} className="text-slate-400 p-2 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[32px] space-y-1 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center gap-2 text-emerald-500 mb-1">
                            <ArrowUpCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                                {filterPeriod === '1month' ? '총 수입' : '기간 내 수입 합계'}
                            </span>
                        </div>
                        <p className="text-xl font-black text-white tracking-tight">
                            ₩{monthSummary?.income.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className="bg-slate-900/60 border border-white/5 p-5 rounded-[32px] space-y-1 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <ArrowDownCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                                {filterPeriod === '1month' ? '총 지출' : '기간 내 지출 합계'}
                            </span>
                        </div>
                        <p className="text-xl font-black text-white tracking-tight">
                            ₩{monthSummary?.expense.toLocaleString() || 0}
                        </p>
                    </div>
                </div>

                {/* Transaction List Container */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">거래 상세 내역</h3>
                        <span className="text-[11px] font-bold text-slate-600 tracking-wider">
                            {filterPeriod === '1month'
                                ? format(selectedDate, 'MMMM', { locale: ko })
                                : '검색 결과'}
                        </span>
                    </div>
                    <TransactionList
                        selectedMonth={selectedDate}
                        searchQuery={searchQuery}
                        filterPeriod={filterPeriod}
                    />
                </div>
            </div>
        </div>
    )
}
