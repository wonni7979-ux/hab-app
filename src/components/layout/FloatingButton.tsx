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
import { usePathname } from 'next/navigation'

export function FloatingButton() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Don't show on login page
    if (pathname === '/login') return null

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <div className="fixed bottom-[100px] left-0 right-0 z-[60] pointer-events-none flex justify-center px-6">
                <div className="w-full max-w-md relative flex justify-end gap-3 pointer-events-auto">
                    <button
                        className="bg-slate-800/90 backdrop-blur-md text-white rounded-full px-5 py-2.5 flex items-center gap-2 shadow-xl border border-white/10 active:scale-95 transition-transform"
                        onClick={() => setOpen(true)}
                    >
                        <span className="text-lg">🍴</span>
                        <span className="text-xs font-bold whitespace-nowrap">식비 입력</span>
                    </button>
                    <DrawerTrigger asChild>
                        <Button
                            className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white transition-transform active:scale-90 border-4 border-white/10"
                            size="icon"
                        >
                            <Plus className="h-8 w-8" />
                        </Button>
                    </DrawerTrigger>
                </div>
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
