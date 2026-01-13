'use client'

import { ArrowLeft, Bell, BellOff, Info, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

const mockNotifications = [
    {
        id: 1,
        type: 'alert',
        title: '예산 소진 임박',
        message: '이번 달 식비 예산의 90%를 사용했습니다. 조금만 더 아껴볼까요?',
        time: '10분 전',
        isRead: false,
        icon: AlertTriangle,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10'
    },
    {
        id: 2,
        type: 'tip',
        title: '절약 꿀팁 도착',
        message: '고정 지출을 줄이는 5가지 방법을 확인해보세요.',
        time: '2시간 전',
        isRead: false,
        icon: Zap,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10'
    },
    {
        id: 3,
        type: 'system',
        title: '앱 업데이트 알림',
        message: '더 빠르고 부드러워진 PWA 버전 v1.2가 출시되었습니다.',
        time: '어제',
        isRead: true,
        icon: Info,
        color: 'text-primary',
        bgColor: 'bg-primary/10'
    },
    {
        id: 4,
        type: 'success',
        title: '목표 달성 축하!',
        message: '지난달 지출 목표 100만원 이하 유지를 성공하셨습니다.',
        time: '2일 전',
        isRead: true,
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10'
    },
]

export default function NotificationsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="flex items-center justify-between p-6 sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-white/5">
                <Link href="/">
                    <div className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="text-white" size={24} />
                    </div>
                </Link>
                <h1 className="text-xl font-black text-white tracking-tight">알림 센터</h1>
                <button className="text-[12px] font-bold text-primary hover:text-primary/80 transition-colors">
                    전체 읽음
                </button>
            </header>

            <div className="px-6 space-y-6 pt-6">
                {mockNotifications.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Recent Activity</p>
                            <span className="text-[10px] font-black text-primary px-2 py-0.5 rounded-full bg-primary/10">
                                {mockNotifications.filter(n => !n.isRead).length} New
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {mockNotifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "group flex items-start gap-4 p-5 rounded-[28px] border transition-all duration-300 cursor-pointer relative overflow-hidden",
                                        n.isRead
                                            ? "bg-slate-900/20 border-white/5 opacity-60 hover:opacity-100"
                                            : "bg-slate-900/60 border-white/10 shadow-xl shadow-primary/5 hover:bg-slate-800/80"
                                    )}
                                >
                                    {/* Unread indicator */}
                                    {!n.isRead && (
                                        <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(29,161,242,0.8)]" />
                                    )}

                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform",
                                        n.bgColor,
                                        n.color
                                    )}>
                                        <n.icon size={24} />
                                    </div>

                                    <div className="flex-1 space-y-1 pr-4">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-[15px] font-black text-white leading-tight">
                                                {n.title}
                                            </h4>
                                        </div>
                                        <p className="text-[13px] font-bold text-slate-400 leading-relaxed">
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-600 pt-1">
                                            {n.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 px-10">
                        <div className="w-16 h-16 rounded-[28px] bg-slate-900/50 flex items-center justify-center text-slate-700 border border-white/5">
                            <BellOff size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-white font-black text-lg">새로운 알림이 없습니다</p>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                나중에 유용한 재정 팁과 소식을<br />이곳에서 확인해보세요!
                            </p>
                        </div>
                    </div>
                )}

                <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/10 space-y-3 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-12 h-12 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <h5 className="text-[13px] font-black text-primary">💡 효율적인 자금 관리 팁</h5>
                    <p className="text-[12px] text-slate-400 font-bold leading-relaxed">
                        알림 설정을 켜두시면 예산 소진 알림이나 맞춤 절약 가이드를 실시간으로 받아보실 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    )
}
