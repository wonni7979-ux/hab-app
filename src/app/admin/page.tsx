'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Tags, CreditCard, Users, BellRing, Megaphone, FileUp, Activity, MessageSquareText, KeyRound } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { startOfMonth, endOfMonth } from 'date-fns'

export default function AdminIndexPage() {
    const supabase = createClient()

    // Fetch this month's macro statistics
    const { data: macroStats, isLoading } = useQuery({
        queryKey: ['admin_macro_stats'],
        queryFn: async () => {
            const start = startOfMonth(new Date()).toISOString()
            const end = endOfMonth(new Date()).toISOString()

            // Fetch test accounts list
            const { data: testAccounts } = await supabase.from('test_accounts').select('user_id')
            const testUserIds = testAccounts?.map(t => t.user_id) || []

            // Fetch transactions for this month
            const { data, error } = await supabase
                .from('transactions')
                .select('amount, type, user_id')
                .gte('created_at', start)
                .lte('created_at', end)

            if (error) return null

            // Filter out test accounts for accurate macro stats
            const validData = data.filter(tx => !testUserIds.includes(tx.user_id))

            let income = 0
            let expense = 0
            validData.forEach(tx => {
                if (tx.type === 'income') income += Number(tx.amount)
                if (tx.type === 'expense') expense += Number(tx.amount)
            })

            return [
                { name: '유입액 (수입)', value: income, fill: '#3b82f6' },
                { name: '지출액 (비용)', value: expense, fill: '#ef4444' }
            ]
        }
    })

    const adminMenus = [
        {
            title: '표준 카테고리 관리',
            desc: '시스템 전역 지출/수입 카테고리 설정',
            icon: Tags,
            href: '/admin/categories',
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        },
        {
            title: '결제 수단 관리',
            desc: '전체 결제 수단(카드/은행/페이) 등록',
            icon: CreditCard,
            href: '/admin/payments',
            color: 'text-violet-500',
            bg: 'bg-violet-50'
        },
        {
            title: '사용자 통계 및 관리',
            desc: '자산 현황 차트 및 보안 마스킹 권한 관리',
            icon: Users,
            href: '/admin/users',
            color: 'text-rose-500',
            bg: 'bg-rose-50'
        },
        {
            title: 'UX 퍼널 분석 & 이탈 추적',
            desc: '입력 소요 시간 및 작성 중단율 분석 대시보드',
            icon: Activity,
            href: '/admin/analytics',
            color: 'text-sky-500',
            bg: 'bg-sky-50'
        },
        {
            title: '이탈 사용자 리텐션 관리',
            desc: '7일 이상 장기 미입력자 조회 및 푸시 독려',
            icon: BellRing, /* or another suitable icon, I am reusing BellRing for push notifications concept */
            href: '/admin/retention',
            color: 'text-pink-500',
            bg: 'bg-pink-50'
        },
        {
            title: '공지사항 관리',
            desc: '사용자 메인 홈에 노출될 시스템 알림 배포',
            icon: BellRing,
            href: '/admin/announcements',
            color: 'text-amber-500',
            bg: 'bg-amber-50'
        },
        {
            title: '타겟팅 광고 관리 (수익화)',
            desc: '소비 패턴에 맞춘 금융 상품 광고 배포',
            icon: Megaphone,
            href: '/admin/ads',
            color: 'text-fuchsia-500',
            bg: 'bg-fuchsia-50'
        },
        {
            title: 'CSV/백업 인프라 관리',
            desc: '대량 업로드 에러 로그 및 DB 백업 부하 모니터링',
            icon: FileUp,
            href: '/admin/data',
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
        },
        {
            title: '1:1 고객 문의 관리 (CS)',
            desc: '사용자 지원 메시지 답변 및 해결',
            icon: MessageSquareText,
            href: '/admin/support',
            color: 'text-indigo-500',
            bg: 'bg-indigo-50'
        },
        {
            title: '고객 계정 관리 (ID/PW 복구)',
            desc: '이메일 확인 및 강제 비밀번호 초기화',
            icon: KeyRound,
            href: '/admin/accounts',
            color: 'text-rose-500',
            bg: 'bg-rose-50'
        }
    ]

    return (
        <div className="p-4 py-6 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800">운영자 센터 가이드</h2>
                <p className="text-sm text-slate-500 mt-1">시스템 권한에 따라 접근할 수 있는 메뉴가 다를 수 있습니다.</p>
            </div>

            {/* Macro Visualization (This Month) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col pt-4">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">이번 달 거시적 현황 (Macro View)</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">*사내 테스트 계정(test_accounts)을 제외한 실제 사용자 데이터 합산</p>
                    </div>
                </div>
                {isLoading ? (
                    <div className="h-[120px] flex items-center justify-center text-slate-400 text-sm">데이터 집계 중...</div>
                ) : (
                    <div className="h-[140px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={macroStats || []} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} />
                                <Tooltip 
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value: any) => [`${Number(value).toLocaleString()} 원`, '금액']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                    {macroStats?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3">
                {adminMenus.map((menu) => (
                    <Link 
                        key={menu.href} 
                        href={menu.href}
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:bg-slate-50 transition-colors"
                    >
                        <div className={`p-3 rounded-2xl ${menu.bg}`}>
                            <menu.icon className={`w-6 h-6 ${menu.color}`} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">{menu.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{menu.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
