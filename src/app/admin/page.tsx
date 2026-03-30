'use client'

import Link from 'next/link'
import { Tags, CreditCard, Users, BellRing, Megaphone, FileUp } from 'lucide-react'

export default function AdminIndexPage() {
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
        }
    ]

    return (
        <div className="p-4 py-6 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800">운영자 센터 가이드</h2>
                <p className="text-sm text-slate-500 mt-1">시스템 권한에 따라 접근할 수 있는 메뉴가 다를 수 있습니다.</p>
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
