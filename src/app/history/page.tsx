'use client'

import { useState } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react'
import Link from 'next/link'
import { TransactionList } from '@/components/transactions/TransactionList'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export default function HistoryPage() {
    const supabase = createClient()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const monthStr = format(selectedDate, 'yyyy-MM')

    const { data: monthSummary } = useQuery({
        queryKey: ['month-summary', monthStr],
        queryFn: async () => {
            const start = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), 'yyyy-MM-dd')
            const end = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), 'yyyy-MM-dd')

            const { data, error } = await supabase
                .from('transactions')
                .select('amount, type')
                .gte('date', start)
                .lte('date', end)

            if (error) throw error

            return data.reduce((acc, t) => {
                if (t.type === 'expense') acc.expense += t.amount
                else acc.income += t.amount
                return acc
            }, { income: 0, expense: 0 })
        }
    })

    const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1))
    const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1))

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
                <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500">
                    <Filter size={24} />
                </button>
            </header>

            <div className="px-6 space-y-8 pt-4">
                {/* Month Selector */}
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

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[32px] space-y-1 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center gap-2 text-emerald-500 mb-1">
                            <ArrowUpCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">총 수입</span>
                        </div>
                        <p className="text-xl font-black text-white tracking-tight">
                            ₩{monthSummary?.income.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className="bg-slate-900/60 border border-white/5 p-5 rounded-[32px] space-y-1 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <ArrowDownCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">총 지출</span>
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
                            {format(selectedDate, 'MMMM', { locale: ko })}
                        </span>
                    </div>
                    <TransactionList selectedMonth={selectedDate} />
                </div>
            </div>
        </div>
    )
}
