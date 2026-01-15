'use client'

import { ArrowLeft, ChevronRight, Tags, CreditCard, PiggyBank, Bell, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SettingsPage() {
    const supabase = createClient()
    const router = useRouter()

    const handleLogout = async () => {
        const { signout } = await import('@/app/login/actions')

        // 1. Explicitly clear local security markers before server call
        sessionStorage.clear()
        document.cookie = 'session_presence=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'

        // 2. Perform Server-side Signout (Clears HttpOnly cookies)
        await signout()

        toast.success('로그아웃 되었습니다.')
    }

    const menuItems = [
        { icon: Tags, label: '카테고리 관리', href: '/settings/categories', color: 'text-blue-400' },
        { icon: CreditCard, label: '결제 수단 관리', href: '/settings/payment-methods', color: 'text-emerald-400' },
        { icon: PiggyBank, label: '예산 관리', href: '/settings/budgets', color: 'text-rose-400' },
        { icon: Zap, label: '반복 거래 관리', href: '/settings/templates', color: 'text-yellow-400' },
        { icon: Bell, label: '알림 설정', href: '/settings/notifications', color: 'text-amber-400' },
        { icon: User, label: '프로필 수정', href: '/settings/profile', color: 'text-slate-400' },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            <header className="flex items-center gap-4 p-6">
                <Link href="/">
                    <ArrowLeft className="text-white" size={24} />
                </Link>
                <h1 className="text-xl font-bold text-white">설정</h1>
            </header>

            <div className="px-6 space-y-6">
                <div className="space-y-3">
                    {menuItems.map((item, idx) => (
                        <Link key={idx} href={item.href}>
                            <Card className="flex items-center justify-between p-4 bg-slate-900/40 border-white/5 hover:bg-slate-800/60 transition-colors mb-3">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl bg-slate-800 ${item.color}`}>
                                        <item.icon size={20} />
                                    </div>
                                    <span className="text-[15px] font-bold text-slate-200">{item.label}</span>
                                </div>
                                <ChevronRight className="text-slate-600" size={18} />
                            </Card>
                        </Link>
                    ))}
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold hover:bg-rose-500/20 transition-colors"
                >
                    <LogOut size={20} />
                    <span>로그아웃</span>
                </button>
            </div>
        </div>
    )
}
