'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Bell, BellOff, Info, Zap, Calendar, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NotificationSetting {
    id: string
    title: string
    description: string
    icon: any
    enabled: boolean
    color: string
}

export default function NotificationSettingsPage() {
    const [settings, setSettings] = useState<NotificationSetting[]>([
        {
            id: 'push',
            title: '푸시 알림',
            description: '중요한 알림을 실시간으로 보내드립니다.',
            icon: Bell,
            enabled: false,
            color: 'text-primary'
        },
        {
            id: 'daily',
            title: '일일 결과 리포트',
            description: '매일 저녁 오늘의 소비 내역을 요약해드려요.',
            icon: Calendar,
            enabled: true,
            color: 'text-emerald-400'
        },
        {
            id: 'budget',
            title: '예산 초과 경고',
            description: '예산의 80% 이상 사용 시 알려드립니다.',
            icon: TrendingDown,
            enabled: true,
            color: 'text-rose-400'
        },
        {
            id: 'ai',
            title: 'AI 분석 인사이트',
            description: 'AI가 발견한 절약 팁과 소비 패턴을 공유합니다.',
            icon: Zap,
            enabled: true,
            color: 'text-amber-400'
        }
    ])

    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')

    useEffect(() => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission)
        }
    }, [])

    const toggleSetting = (id: string) => {
        if (id === 'push' && !settings.find(s => s.id === 'push')?.enabled) {
            handleRequestPermission()
            return
        }

        setSettings(prev => prev.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        ))

        const setting = settings.find(s => s.id === id)
        if (setting) {
            toast.success(`${setting.title} 설정이 ${!setting.enabled ? '최근' : '비활성화'}되었습니다.`)
        }
    }

    const handleRequestPermission = async () => {
        if (!('Notification' in window)) {
            toast.error('이 브라우저는 알림 기능을 지원하지 않습니다.')
            return
        }

        const permission = await Notification.requestPermission()
        setPermissionStatus(permission)
        if (permission === 'granted') {
            setSettings(prev => prev.map(s =>
                s.id === 'push' ? { ...s, enabled: true } : s
            ))
            toast.success('알림 권한이 승인되었습니다.')
        } else {
            toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 변경해주세요.')
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            <header className="flex items-center gap-4 p-6">
                <Link href="/settings">
                    <ArrowLeft className="text-white" size={24} />
                </Link>
                <h1 className="text-xl font-bold text-white">알림 설정</h1>
            </header>

            <div className="px-6 space-y-6">
                {/* Permission Banner */}
                {permissionStatus === 'default' && (
                    <Card className="bg-primary/10 border-primary/20 p-4 rounded-2xl flex items-start gap-3">
                        <Info className="text-primary shrink-0" size={20} />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-white">알림 권한이 필요합니다</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                중요 정보를 실시간으로 받으려면 브라우저 알림 권한을 허용해 주세요.
                            </p>
                            <button
                                onClick={handleRequestPermission}
                                className="text-xs font-bold text-primary mt-2 flex items-center gap-1 hover:underline"
                            >
                                지금 권한 요청하기
                            </button>
                        </div>
                    </Card>
                )}

                <div className="space-y-4">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">알림 항목별 설정</h2>

                    {settings.map((item) => (
                        <Card
                            key={item.id}
                            className="bg-slate-900/40 border-white/5 overflow-hidden active:scale-[0.98] transition-all"
                            onClick={() => toggleSetting(item.id)}
                        >
                            <CardContent className="p-4 flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-2.5 rounded-xl bg-slate-800", item.color)}>
                                        <item.icon size={22} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[15px] font-bold text-white">{item.title}</p>
                                        <p className="text-xs text-slate-500 leading-tight">{item.description}</p>
                                    </div>
                                </div>

                                {/* Custom Toggle Switch */}
                                <div className={cn(
                                    "w-12 h-6 rounded-full p-1 transition-colors duration-300 relative",
                                    item.enabled ? "bg-primary" : "bg-slate-700"
                                )}>
                                    <div className={cn(
                                        "w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300",
                                        item.enabled ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="pt-4 px-1">
                    <p className="text-[11px] text-slate-600 leading-relaxed text-center">
                        알림 설정은 기기별로 각각 다르게 설정될 수 있습니다.<br />
                        푸시 알림은 브라우저 설정의 영향을 받습니다.
                    </p>
                </div>
            </div>
        </div>
    )
}
