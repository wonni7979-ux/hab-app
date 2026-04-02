import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logSystemEvent } from '@/app/actions/logActions'
import { AdminAccessLogger } from '@/components/admin/AdminAccessLogger'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user is an admin
    const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single()

    if (!adminData) {
        // Log unauthorized access
        await logSystemEvent('WARNING', 'admin_auth', '비인가 관리자센터 접근 시도 거부', { uid: user.id })
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <AdminAccessLogger />
            {/* Admin Header */}
            <header className="sticky top-0 z-50 bg-white/80 border-b border-slate-100 backdrop-blur-xl">
                <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto relative">
                    <Link href="/settings" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-sm font-semibold text-slate-800 absolute left-1/2 -translate-x-1/2">
                        운영자 대시보드
                    </h1>
                </div>
            </header>
            
            <main className="max-w-md mx-auto relative">
                {children}
            </main>
        </div>
    )
}
