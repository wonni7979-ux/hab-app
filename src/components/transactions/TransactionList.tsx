'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Wallet, Trash2, Search, Filter, Calendar as CalendarIcon, Zap, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Category {
    name: string
    icon: string | null
    color: string
}

interface PaymentMethod {
    name: string
}

interface Transaction {
    id: string
    date: string
    type: 'expense' | 'income' | 'transfer'
    amount: number
    description: string | null
    category_id: string | null
    payment_method_id: string
    to_payment_method_id: string | null
    categories: Category | null
    payment_methods: { name: string } | null
    to_payment_methods?: { name: string } | null
}

interface TransactionListProps {
    selectedMonth?: Date
    searchQuery?: string
    filterPeriod?: '1month' | '3months' | '6months' | '1year' | 'all'
    filterCategory?: string
}

export function TransactionList({
    selectedMonth = new Date(),
    searchQuery = '',
    filterPeriod = '1month',
    filterCategory = ''
}: TransactionListProps) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    const { data: transactions, isLoading } = useQuery({
        queryKey: ['transactions', format(selectedMonth, 'yyyy-MM'), searchQuery, filterPeriod, filterCategory],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.log('TransactionList: No user found')
                return []
            }

            console.log('TransactionList: Fetching for user', user.id, 'month', format(selectedMonth, 'yyyy-MM'))

            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    categories(name, icon, color),
                    payment_methods!payment_method_id(name),
                    to_payment_methods:payment_methods!to_payment_method_id(name)
                `)
                .eq('user_id', user.id)

            // Handle period filtering
            if (filterPeriod !== '1month') {
                const now = new Date()
                let startDate = new Date()
                if (filterPeriod === '3months') startDate.setMonth(now.getMonth() - 3)
                else if (filterPeriod === '6months') startDate.setMonth(now.getMonth() - 6)
                else if (filterPeriod === '1year') startDate.setFullYear(now.getFullYear() - 1)
                else if (filterPeriod === 'all') startDate = new Date(1900, 0, 1)

                query = query.gte('date', format(startDate, 'yyyy-MM-dd'))
            } else {
                const start = format(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1), 'yyyy-MM-dd')
                const end = format(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0), 'yyyy-MM-dd')
                query = query.gte('date', start).lte('date', end)
            }

            // Handle search
            if (searchQuery) {
                query = query.or(`description.ilike.%${searchQuery}%,categories.name.ilike.%${searchQuery}%`)
            }

            // Handle category filter
            if (filterCategory) {
                query = query.eq('category_id', filterCategory)
            }

            const { data, error } = await query
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Transactions fetch error:', error)
                toast.error('내역을 불러오는 중 오류가 발생했습니다.')
                throw error
            }
            console.log('TransactionList: Fetched', data?.length, 'records')
            return data as any[]
        },
        staleTime: 0, // Ensure we always get fresh data
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('transactions').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('거래가 삭제되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['stats'] })
            queryClient.invalidateQueries({ queryKey: ['budget-status'] })
        },
    })

    const saveTemplateMutation = useMutation({
        mutationFn: async (t: Transaction) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Auth required')

            const { error } = await supabase.from('transaction_templates').insert({
                user_id: user.id,
                name: t.description || (t.type === 'transfer' ? '자산 이동' : t.categories?.name),
                type: t.type,
                amount: t.amount,
                category_id: t.category_id,
                payment_method_id: t.payment_method_id,
                to_payment_method_id: t.to_payment_method_id,
                description: t.description
            })
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('템플릿으로 저장되었습니다!')
            queryClient.invalidateQueries({ queryKey: ['transaction-templates'] })
        },
        onError: (err: any) => {
            toast.error('오류가 발생했습니다: ' + err.message)
        }
    })

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">데이터 로딩 중...</p>
        </div>
    )

    if (!transactions || transactions.length === 0) return (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 px-10">
            <div className="w-16 h-16 rounded-3xl bg-slate-900/50 flex items-center justify-center text-slate-700 border border-white/5">
                <Calendar size={32} />
            </div>
            <div className="space-y-1">
                <p className="text-white font-black text-lg">기록이 없습니다</p>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                    선택하신 달에는 아직 등록된 내역이 없네요.<br />새로운 지출이나 수입을 기록해보세요!
                </p>
            </div>
        </div>
    )

    // 날짜별로 그룹화
    const grouped = (transactions || []).reduce((acc: Record<string, Transaction[]>, t: Transaction) => {
        const date = t.date
        if (!acc[date]) acc[date] = []
        acc[date].push(t)
        return acc
    }, {})

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map((date) => {
                const dayTransactions = grouped[date]
                const dayExpense = dayTransactions.reduce((sum: number, t: Transaction) => t.type === 'expense' ? sum + t.amount : sum, 0)
                const dayIncome = dayTransactions.reduce((sum: number, t: Transaction) => t.type === 'income' ? sum + t.amount : sum, 0)

                return (
                    <div key={date} className="space-y-4">
                        <div className="flex justify-between items-end px-2">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    {format(new Date(date), 'yyyy.MM')}
                                </p>
                                <h3 className="text-[15px] font-black text-white">
                                    {format(new Date(date), 'd일 EEEE', { locale: ko })}
                                </h3>
                            </div>
                            <div className="text-right space-y-0.5">
                                {dayIncome > 0 && <p className="text-[11px] font-black text-emerald-500">+{dayIncome.toLocaleString()}원</p>}
                                {dayExpense > 0 && <p className="text-[13px] font-black text-slate-300">-{dayExpense.toLocaleString()}원</p>}
                            </div>
                        </div>

                        <div className="grid gap-3">
                            {dayTransactions.map((t: Transaction) => (
                                <div
                                    key={t.id}
                                    className="group flex items-center gap-4 p-5 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[28px] hover:bg-slate-800/60 transition-all duration-300 cursor-pointer relative overflow-hidden"
                                >
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                                    <div
                                        className="flex items-center justify-center h-12 w-12 rounded-2xl shrink-0 shadow-inner group-hover:scale-105 transition-transform"
                                        style={{
                                            backgroundColor: t.type === 'transfer' ? '#47556915' : `${t.categories?.color}15`,
                                            color: t.type === 'transfer' ? '#94a3b8' : t.categories?.color
                                        }}
                                    >
                                        <span className="text-xl">
                                            {t.type === 'transfer' ? '🔄' : (t.categories?.icon || '📦')}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className="text-[15px] font-black text-white truncate pr-2">
                                                {t.type === 'transfer' ? '자산 이동' : (t.description || t.categories?.name)}
                                            </p>
                                            <p className={cn(
                                                "text-[15px] font-black shrink-0",
                                                t.type === 'expense' ? "text-white" : t.type === 'income' ? "text-emerald-400" : "text-slate-400"
                                            )}>
                                                {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}{t.amount.toLocaleString()}원
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                                                <Wallet size={10} />
                                                <span>
                                                    {t.type === 'transfer'
                                                        ? `${t.payment_methods?.name} → ${t.to_payment_methods?.name}`
                                                        : (t.payment_methods?.name || '현금')}
                                                </span>
                                            </div>
                                            {t.type !== 'transfer' && (
                                                <>
                                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                    <span className="text-[11px] font-bold text-slate-500">{t.categories?.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-slate-600 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                saveTemplateMutation.mutate(t)
                                            }}
                                            title="템플릿으로 저장"
                                        >
                                            <Zap size={18} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (confirm('이 내역을 삭제하시겠습니까?')) {
                                                    deleteMutation.mutate(t.id)
                                                }
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
