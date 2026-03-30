'use client'

import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Users, AlertTriangle, Activity, Lock } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { format, subDays } from 'date-fns'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function AdminUsersPage() {
    const supabase = createClient()
    const [excludeTestAccounts, setExcludeTestAccounts] = useState(true)

    const { data: roleData, isLoading: roleLoading } = useQuery({
        queryKey: ['admin_role'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null
            const { data } = await supabase.from('admins').select('role').eq('id', user.id).single()
            return data?.role || 'cs'
        }
    })

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin_user_stats', excludeTestAccounts],
        queryFn: async () => {
            const { data: testAccounts } = await supabase.from('test_accounts').select('user_id')
            const testUserIds = testAccounts?.map(t => t.user_id) || []

            const { data, error } = await supabase
                .from('transactions')
                .select('type, amount, user_id, category_id, created_at, description, id')
                .order('created_at', { ascending: false })
                .limit(1000) // Limit for demo purposes

            if (error) throw error

            let validData = data
            if (excludeTestAccounts && testUserIds.length > 0) {
                validData = data.filter(tx => !testUserIds.includes(tx.user_id))
            }

            const usersSet = new Set()
            let totalIncome = 0
            let totalExpense = 0
            const typeDistribution: any = { income: 0, expense: 0 }
            const timelineData: any = {}

            // Populate last 7 days timeline structure
            for (let i = 6; i >= 0; i--) {
                timelineData[format(subDays(new Date(), i), 'MM-dd')] = { name: format(subDays(new Date(), i), 'MM-dd'), amount: 0 }
            }

            validData.forEach((tx) => {
                if (tx.user_id) usersSet.add(tx.user_id)
                const amt = Number(tx.amount)
                
                if (tx.type === 'income') {
                    totalIncome += amt
                    typeDistribution.income += amt
                }
                if (tx.type === 'expense') {
                    totalExpense += amt
                    typeDistribution.expense += amt
                }

                const dateStr = format(new Date(tx.created_at), 'MM-dd')
                if (timelineData[dateStr]) {
                    timelineData[dateStr].amount += 1 // Count transactions per day
                }
            })

            return {
                totalUsers: usersSet.size,
                totalTransactions: validData.length,
                totalIncome,
                totalExpense,
                pieData: [
                    { name: '지출', value: typeDistribution.expense },
                    { name: '수입', value: typeDistribution.income }
                ],
                lineData: Object.values(timelineData),
                recentTransactions: validData.slice(0, 10) // Top 10 for log
            }
        }
    })

    if (roleLoading || statsLoading) return <div className="p-8 text-center text-slate-500">데이터 불러오는 중...</div>

    const isCS = roleData === 'cs'

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Users className="text-rose-500 w-5 h-5" />
                    <h2 className="text-lg font-bold text-slate-800">사용자 데이터 관리</h2>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={excludeTestAccounts} 
                            onChange={(e) => setExcludeTestAccounts(e.target.checked)}
                            className="w-4 h-4 text-rose-500 rounded border-slate-300"
                        />
                        테스트 계정 제외
                    </label>
                    {isCS && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200 ml-2">
                            <Lock className="w-3 h-3" /> CS 권한 (데이터 마스킹 활성화)
                        </div>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-400 mb-1">최근 생성된 거래 내역</span>
                    <span className="text-xl font-black text-slate-800">{stats?.totalTransactions.toLocaleString()} 건</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-400 mb-1">활동 중인 고유 사용자</span>
                    <span className="text-xl font-black text-slate-800">{stats?.totalUsers.toLocaleString()} 명</span>
                </div>
            </div>

            {/* Visualizations */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">수입/지출 비율</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.pieData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === '수입' ? '#3b82f6' : '#ef4444'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} 원`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 text-xs font-bold mt-2">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500" /> 수입</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> 지출</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 text-emerald-500">
                        <Activity className="w-4 h-4" /> 일별 사용자 참여도 (트랜잭션 수)
                    </h3>
                    <div className="h-[150px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.lineData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#94a3b8" />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${value} 건`, '거래량']}
                                />
                                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Logs & Data Masking Implementation */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800">최근 거래 실시간 로그</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top 10</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {stats?.recentTransactions.map((tx) => (
                        <div key={tx.id} className="p-3 px-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 shrink-0">{format(new Date(tx.created_at), 'HH:mm')}</span>
                                {/* Data Masking Logic */}
                                <span className="text-sm font-semibold text-slate-700 truncate max-w-[150px]">
                                    {isCS ? (tx.description ? tx.description.substring(0, 2) + '***' : '비공개 내역') : (tx.description || '내역 없음')}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-blue-500' : 'text-slate-800'}`}>
                                    {isCS && tx.amount > 100000 ? '***,***' : Number(tx.amount).toLocaleString()} 원
                                </span>
                            </div>
                        </div>
                    ))}
                    {!stats?.recentTransactions.length && (
                        <div className="p-6 text-center text-slate-400 text-xs">최근 데이터가 없습니다.</div>
                    )}
                </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3 mt-8">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-amber-800">보안 및 개인정보 보호 (Privacy First)</h4>
                    <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                        RBAC 통제: 최고 관리자(superadmin) 외에는 민감한 사용자 메모나 고액 거래 내역이 <strong className="font-extrabold text-amber-900">마스킹(*)</strong> 처리되어 표시됩니다.
                    </p>
                </div>
            </div>
        </div>
    )
}
