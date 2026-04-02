'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Tags, CreditCard, Users, BellRing, Megaphone, FileUp, Activity, MessageSquareText, Smartphone, Database, Clock, PieChart as PieChartIcon, ShieldAlert } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function AdminIndexPage() {
    const supabase = createClient()

    // Fetch KPI and Macro Stats via secure RPC
    const { data: macroStats, isLoading } = useQuery({
        queryKey: ['admin_macro_stats_v2'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_macro_stats')
            if (error) {
                console.error("RPC Error:", error)
                return null
            }
            // Add custom fill colors to 'this_month'
            if (data?.this_month) {
                data.this_month = data.this_month.map((item: any) => ({
                    ...item,
                    name: item.name === 'income' ? '유입액 (수입)' : '지출액 (비용)',
                    fill: item.name === 'income' ? '#3b82f6' : '#ef4444'
                }))
            }
            return data
        }
    })

    const PIE_COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6'];

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
            title: '시스템 로그 및 보안',
            desc: '비정상 접속 차단 및 사용자 오류 에러 트래픽 모니터링',
            icon: ShieldAlert,
            href: '/admin/logs',
            color: 'text-red-600',
            bg: 'bg-red-50'
        },
        {
            title: '1:1 고객 문의 관리 (CS)',
            desc: '사용자 지원 메시지 답변 및 해결',
            icon: MessageSquareText,
            href: '/admin/support',
            color: 'text-indigo-500',
            bg: 'bg-indigo-50'
        }
    ]

    return (
        <div className="p-4 py-6 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800">운영자 센터 가이드</h2>
                <p className="text-sm text-slate-500 mt-1">시스템 권한에 따라 접근할 수 있는 메뉴가 다를 수 있습니다.</p>
            </div>

            {/* Top Level KPIs */}
            {isLoading ? (
                <div className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-500 rounded-2xl p-4 text-white shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start opacity-80">
                            <span className="text-xs font-bold">총 가입자 수</span>
                            <Users className="w-4 h-4" />
                        </div>
                        <div className="text-2xl font-black mt-2">{macroStats?.total_users?.toLocaleString() || 0} 명</div>
                    </div>
                    <div className="bg-emerald-500 rounded-2xl p-4 text-white shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start opacity-80">
                            <span className="text-xs font-bold">DAU (일일 활성)</span>
                            <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="text-2xl font-black mt-2">{macroStats?.dau?.toLocaleString() || 0} 명</div>
                    </div>
                    <div className="bg-amber-500 rounded-2xl p-4 text-white shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start opacity-80">
                            <span className="text-xs font-bold">누적 거래 건수</span>
                            <Database className="w-4 h-4" />
                        </div>
                        <div className="text-2xl font-black mt-2">{macroStats?.total_tx?.toLocaleString() || 0} 건</div>
                    </div>
                </div>
            )}

            {/* Macro Visualization (This Month & Trends) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. 수입 vs 지출 바 차트 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">이번 달 수입 vs 지출</h3>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="h-[140px] flex items-center justify-center text-slate-400 text-sm animate-pulse bg-slate-50 rounded-xl" />
                    ) : (
                        <div className="w-full">
                            <ResponsiveContainer width="100%" height={140}>
                                <BarChart data={macroStats?.this_month || []} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value: any) => [`${Number(value).toLocaleString()} 원`, '금액']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                        {macroStats?.this_month?.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* 2. 인기 카테고리 (Pie Chart) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <PieChartIcon className="w-5 h-5 text-pink-500" />
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">인기 지출 카테고리 TOP 5</h3>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="h-[140px] flex items-center justify-center text-slate-400 text-sm animate-pulse bg-slate-50 rounded-xl" />
                    ) : (
                        <div className="w-full mt-[-10px]">
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={macroStats?.top_categories || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="count"
                                        stroke="none"
                                    >
                                        {macroStats?.top_categories?.map((entry: any, index: number) => (
                                            <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: any) => [`${value}건`, '기록 수']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* 3. 활성 시간대 (Line Chart) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-sky-500" />
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">활성 기록 시간대 분포</h3>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="h-[140px] flex items-center justify-center text-slate-400 text-sm animate-pulse bg-slate-50 rounded-xl" />
                    ) : (
                        <div className="w-full">
                            <ResponsiveContainer width="100%" height={160}>
                                <LineChart data={macroStats?.peak_hours || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="hour" tickFormatter={(v) => `${v}시`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip 
                                        formatter={(value: any) => [`${value}건`, '기록 수']}
                                        labelFormatter={(label) => `${label}시`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3, fill: '#0ea5e9' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
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
