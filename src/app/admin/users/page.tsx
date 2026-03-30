'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Users, AlertTriangle, Activity } from 'lucide-react'

export default function AdminUsersPage() {
    const supabase = createClient()

    // 1. Fetch total system volume (requires Admin RLS to be active)
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin_user_stats'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('transactions')
                .select('type, amount, user_id')

            if (error) throw error

            const usersSet = new Set()
            let totalIncome = 0
            let totalExpense = 0

            data.forEach((tx) => {
                if (tx.user_id) usersSet.add(tx.user_id)
                if (tx.type === 'income') totalIncome += Number(tx.amount)
                if (tx.type === 'expense') totalExpense += Number(tx.amount)
            })

            return {
                totalUsers: usersSet.size,
                totalTransactions: data.length,
                totalIncome,
                totalExpense
            }
        }
    })

    if (isLoading) return <div className="p-8 text-center text-slate-500">통계 불러오는 중...</div>

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Users className="text-rose-500 w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-800">사용자 데이터 관리</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-400 mb-1">총 생성된 거래 내역</span>
                    <span className="text-xl font-black text-slate-800">{stats?.totalTransactions.toLocaleString()} 건</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-400 mb-1">활동 중인 고유 사용자</span>
                    <span className="text-xl font-black text-slate-800">{stats?.totalUsers.toLocaleString()} 명</span>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    전체 재무 개요 (시스템 총합)
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <span className="text-sm font-semibold text-slate-500">총 기록된 수입</span>
                        <span className="text-sm font-bold text-blue-500">{stats?.totalIncome.toLocaleString()} 원</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                        <span className="text-sm font-semibold text-slate-500">총 기록된 지출</span>
                        <span className="text-sm font-bold text-rose-500">{stats?.totalExpense.toLocaleString()} 원</span>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3 mt-8">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-amber-800">오류 계정 지원 안내</h4>
                    <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                        사용자별 내역 직접 수정 및 휴면 계정 전환 기능은 Supabase Dashboard 또는 Admin CLI 도구를 통해 직접 DB 쿼리로 안전하게 수행할 것을 권장합니다. 개인정보 보호법에 따라 함부로 사용자 데이터를 열람/수정하지 마십시오.
                    </p>
                </div>
            </div>
        </div>
    )
}
