import { createClient } from '@/lib/supabase/server'
import { AlertCircle } from 'lucide-react'

export async function AnnouncementsBanner() {
    const supabase = await createClient()

    // Fetch active announcements
    const { data: notices } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

    if (!notices || notices.length === 0) return null

    const notice = notices[0]

    return (
        <div className="mx-4 mt-4 bg-amber-50 rounded-2xl border border-amber-100 p-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-amber-900">{notice.title}</h4>
                    <p className="text-xs text-amber-800/80 mt-1 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                </div>
            </div>
        </div>
    )
}
