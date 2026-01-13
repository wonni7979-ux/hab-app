'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React from 'react'

export function AISummaryCard() {
    const router = useRouter()

    return (
        <Card className="mx-6 border-none bg-slate-900/40 shadow-xl backdrop-blur-sm group hover:bg-slate-900/60 transition-all duration-500 cursor-pointer" onClick={() => router.push('/stats')}>
            <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                    <h3 className="text-[17px] font-bold text-white leading-tight">
                        평소보다 커피를 2잔 더 드셨네요
                    </h3>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-400">
                            어제보다 커피 지출이 3,000원 늘었어요.
                        </p>
                        <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                            AI 스마트 요약
                        </p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            router.push('/stats')
                        }}
                    >
                        자세히 ...
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
