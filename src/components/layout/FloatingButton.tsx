'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { TransactionForm } from '@/components/forms/TransactionForm'

export function FloatingButton() {
    const [open, setOpen] = useState(false)

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <div className="fixed bottom-6 right-6 flex items-center gap-3 z-40">
                <button
                    className="bg-slate-800/80 backdrop-blur-md text-white rounded-full px-6 py-3 flex items-center gap-2 shadow-xl border border-white/5 active:scale-95 transition-transform"
                    onClick={() => setOpen(true)}
                >
                    <span className="text-xl">🍴</span>
                    <span className="text-sm font-bold">점심 식비 입력하기</span>
                </button>
                <DrawerTrigger asChild>
                    <Button
                        className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white transition-transform active:scale-90"
                        size="icon"
                    >
                        <Plus className="h-8 w-8" />
                    </Button>
                </DrawerTrigger>
            </div>
            <DrawerContent className="max-w-md mx-auto bg-slate-900 border-t-slate-800">
                <DrawerHeader>
                    <DrawerTitle className="text-white">거래 보태기</DrawerTitle>
                    <DrawerDescription className="text-slate-400">오늘의 수입이나 지출을 빠르고 간편하게 기록하세요.</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 pb-12">
                    <TransactionForm onSuccess={() => setOpen(false)} />
                </div>
            </DrawerContent>
        </Drawer>
    )
}
