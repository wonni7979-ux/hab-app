'use client'

import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DashboardHeader() {
    const router = useRouter()

    return (
        <header className="flex items-center justify-between p-6 pb-2">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 border-2 border-primary/20 rounded-full bg-orange-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <span className="text-orange-700 font-bold">E</span>
                </div>
                <span className="text-[15px] font-bold text-slate-100 leading-tight">
                    이번 달 예산이 거의 소진되었어요.
                </span>
            </div>
            <button
                onClick={() => router.push('/notifications')}
                className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
                <Bell size={24} />
                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-background"></span>
            </button>
        </header>
    )
}
