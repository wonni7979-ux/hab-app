'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { BellRing, UsersRound, CalendarOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { differenceInDays, subDays } from 'date-fns'

export default function AdminRetentionPage() {
    const supabase = createClient()

    const { data: inactiveUsers, isLoading } = useQuery({
        queryKey: ['admin_retention_users'],
        queryFn: async () => {
            // Fetch all transactions to find the latest transaction date per user
            // In a real large-scale app, this would be an RPC function or a materialized view
            const { data, error } = await supabase
                .from('transactions')
                .select('user_id, created_at')
                .order('created_at', { ascending: false })

            if (error || !data) return []

            const latestTxMap = new Map<string, Date>()
            data.forEach(tx => {
                if (!latestTxMap.has(tx.user_id)) {
                    latestTxMap.set(tx.user_id, new Date(tx.created_at))
                }
            })

            const now = new Date()
            const inactiveList: { userId: string, lastActive: Date, daysInactive: number }[] = []

            latestTxMap.forEach((lastActive, userId) => {
                const days = differenceInDays(now, lastActive)
                if (days >= 7) {
                    inactiveList.push({ userId, lastActive, daysInactive: days })
                }
            })

            return inactiveList.sort((a, b) => b.daysInactive - a.daysInactive)
        }
    })

    const handleSendPush = (userId: string) => {
        alert(`사용자 ${userId.substring(0, 8)}... 에게 독려 푸시 알림을 발송했습니다!\n"지난 주 지출 내역을 10초 만에 정리해 보세요!"`)
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500 text-sm font-bold animate-pulse">이탈 위험 데이터 집계 중...</div>

    return (
        <div className="p-4 space-y-6 pb-20">
            <div className="flex items-center gap-2 mb-2">
                <UsersRound className="text-pink-500 w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-800">이탈 사용자 (Retention) 관리</h2>
            </div>

            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 flex items-start gap-3">
                <BellRing className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-pink-800">장기 미입력자 맞춤형 푸시 (Retention Push)</h4>
                    <p className="text-xs text-pink-700/80 mt-1 leading-relaxed">
                        최근 7일 이상 가계부를 작성하지 않은 사용자에게 "지출 내역 10초 작성" 독려 메시지를 보내어 앱 재방문을 유도합니다.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <CalendarOff size={14} className="text-slate-500" />
                        7일 이상 미접속 / 미입력 경고 명단
                    </h3>
                    <span className="text-xs font-bold bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">
                        {inactiveUsers?.length || 0} 명
                    </span>
                </div>
                
                <div className="divide-y divide-slate-100">
                    {inactiveUsers?.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm font-bold">
                            현재 장기 미이용 이탈 위험 사용자가 없습니다! 🎉
                        </div>
                    ) : (
                        inactiveUsers?.map((user) => (
                            <div key={user.userId} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs text-slate-400 font-medium">사용자 식별 ID</span>
                                        <span className="text-sm font-bold text-slate-700">{user.userId.substring(0, 18)}...</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-xs text-rose-500 font-black">{user.daysInactive}일째 미접속</span>
                                        <span className="text-[10px] text-slate-400">마지막 작성: {user.lastActive.toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => handleSendPush(user.userId)}
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white h-10 rounded-xl text-xs gap-2 mt-1 shadow-sm"
                                >
                                    <BellRing size={14} /> 맞춤형 푸시 발송 <ArrowRight size={14} className="opacity-50" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
