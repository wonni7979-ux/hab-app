'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, PieChart, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { name: '홈', href: '/', icon: Home },
    { name: '내역', href: '/history', icon: List },
    { name: '통계', href: '/stats', icon: PieChart },
    { name: '설정', href: '/settings', icon: Settings },
]

export function BottomNav() {
    const pathname = usePathname()

    if (pathname === '/login') return null

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b0f19]/80 backdrop-blur-xl border-t border-white/5 pb-safe-area-inset-bottom">
            <div className="flex items-center justify-around h-20 max-w-md mx-auto relative px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center space-y-1.5 w-full transition-all duration-300 relative',
                                isActive ? 'text-primary scale-110' : 'text-slate-500 hover:text-slate-300'
                            )}
                        >
                            <div className={cn(
                                "p-1 rounded-xl transition-colors",
                                isActive && "bg-primary/10"
                            )}>
                                <item.icon className={cn('h-6 w-6', isActive && 'fill-primary/20')} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                isActive ? "opacity-100" : "opacity-60"
                            )}>
                                {item.name}
                            </span>
                            {isActive && (
                                <div className="absolute -top-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(29,161,242,0.8)]" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
