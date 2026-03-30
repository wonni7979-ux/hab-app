'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Activity, Clock, FilterX, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Rectangle } from 'recharts'
import { Progress } from '@/components/ui/progress'

export default function AdminAnalyticsPage() {
    const supabase = createClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin_ux_analytics'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('analytics_logs')
                .select('*')
                .order('created_at', { ascending: true })

            if (error) throw error

            let totalOpens = 0
            let completes = 0
            const dropOffs: Record<string, number> = {
                form_open: 0,
                input_amount: 0,
                select_category: 0,
                select_payment: 0
            }

            const sessionStartTimes: Record<string, number> = {}
            const completionTimes: number[] = []

            data.forEach(log => {
                if (log.event_type === 'form_open') {
                    totalOpens++
                    sessionStartTimes[log.session_id] = new Date(log.created_at).getTime()
                } else if (log.event_type === 'form_close') {
                    const stage = log.event_data?.drop_off_stage
                    if (stage && dropOffs[stage] !== undefined) {
                        dropOffs[stage]++
                    }
                } else if (log.event_type === 'form_complete') {
                    completes++
                    const startTs = sessionStartTimes[log.session_id]
                    if (startTs) {
                        completionTimes.push(new Date(log.created_at).getTime() - startTs)
                    }
                }
            })

            // Funnel math
            const reachedAmount = totalOpens - dropOffs.form_open
            const reachedCategory = reachedAmount - dropOffs.input_amount
            const reachedPayment = reachedCategory - dropOffs.select_category
            const finalCompletes = completes // Should be roughly reachedPayment - dropOffs.select_payment

            const funnelData = [
                { name: '1. 폼 열기', value: totalOpens, fill: '#94a3b8' },
                { name: '2. 금액 입력', value: reachedAmount, fill: '#60a5fa' },
                { name: '3. 카테고리', value: reachedCategory, fill: '#818cf8' },
                { name: '4. 결제 수단', value: reachedPayment, fill: '#c084fc' },
                { name: '5. 저장 완료', value: finalCompletes, fill: '#10b981' },
            ]

            const avgTimeMs = completionTimes.length > 0 
                ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
                : 0
            
            const avgTimeSec = Math.round(avgTimeMs / 1000)

            return {
                totalOpens,
                dropOffs,
                funnelData,
                avgTimeSec,
                completes
            }
        }
    })

    if (isLoading || !data) {
        return <div className="p-8 text-center text-slate-500 text-sm font-bold animate-pulse">데이터를 분석 중입니다...</div>
    }

    const { avgTimeSec, funnelData, dropOffs, totalOpens } = data

    const getTimeColor = (sec: number) => {
        if (sec === 0) return 'text-slate-400'
        if (sec <= 10) return 'text-emerald-500'
        if (sec <= 30) return 'text-amber-500'
        return 'text-rose-500'
    }

    const getTimeStatus = (sec: number) => {
        if (sec === 0) return '데이터 부족'
        if (sec <= 10) return '매우 만족 (빠름)'
        if (sec <= 30) return '경고 (보통)'
        return '이탈 위험 (지연됨)'
    }

    return (
        <div className="p-4 space-y-6 pb-20">
            <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="text-indigo-500 w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-800">UX 퍼널 분석 & 이탈 추적</h2>
            </div>

            {/* Average Time to Log */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <Clock size={14} />
                        <span className="text-xs font-bold">평균 입력 소요 시간 (Avg Time to Log)</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-black ${getTimeColor(avgTimeSec)}`}>
                            {avgTimeSec > 0 ? `${avgTimeSec}초` : '-'}
                        </span>
                        <span className={`text-xs font-bold ${getTimeColor(avgTimeSec)} bg-slate-50 px-2 py-0.5 rounded-md`}>
                            {getTimeStatus(avgTimeSec)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Entry-to-Complete Funnel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                    <Activity size={14} />
                    <span className="text-xs font-bold">작성 단계별 퍼널 (Entry-to-Complete)</span>
                </div>
                <div className="h-[200px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={funnelData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                formatter={(value: any) => [`${value} 회`, '도달 세션']}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32} activeBar={<Rectangle fill="#cbd5e1" />}>
                                {funnelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Abandoned Logs List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-1.5">
                    <FilterX size={14} className="text-rose-500" />
                    <h3 className="text-sm font-bold text-slate-800">주요 이탈 구간 (Drop-off Points)</h3>
                </div>
                <div className="p-4 space-y-4">
                    {totalOpens === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">이탈 데이터가 없습니다.</p>
                    ) : (
                        <>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>카테고리 선택 단계 이탈</span>
                                    <span className="text-rose-500">{dropOffs.select_category}건</span>
                                </div>
                                <Progress value={(dropOffs.select_category / totalOpens) * 100} className="h-1.5 bg-slate-100" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>금액 입력 단계 이탈</span>
                                    <span className="text-amber-500">{dropOffs.input_amount}건</span>
                                </div>
                                <Progress value={(dropOffs.input_amount / totalOpens) * 100} className="h-1.5 bg-slate-100" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>작성창만 열고 바로 이탈</span>
                                    <span className="text-slate-500">{dropOffs.form_open}건</span>
                                </div>
                                <Progress value={(dropOffs.form_open / totalOpens) * 100} className="h-1.5 bg-slate-100" />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
