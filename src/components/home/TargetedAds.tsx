import { createClient } from '@/lib/supabase/server'
import { Target, ExternalLink } from 'lucide-react'

export async function TargetedAds() {
    const supabase = await createClient()

    // 1. Get user spending stats for the month to match with targeted ads
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    
    // Simplification for demo: fetch recent specific type stats 
    const { data: expenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('created_at', startOfMonth.toISOString())

    const totalExpense = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // Fetch active ads that match the criteria
    const { data: ads } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .eq('target_category_type', 'expense')
        .lte('target_amount_threshold', totalExpense) // Threshold must be <= totalExpense
        .order('target_amount_threshold', { ascending: false })
        .limit(1)

    if (!ads || ads.length === 0) return null

    const ad = ads[0]

    return (
        <div className="mx-4 mt-6 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-3xl p-[1px] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white rounded-[23px] p-5 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Target className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex flex-col items-start">
                    <span className="bg-fuchsia-100 text-fuchsia-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-3">맞춤 혜택</span>
                    <h4 className="text-base font-bold text-slate-800">{ad.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed max-w-[85%]">{ad.description}</p>
                    <a 
                        href={ad.click_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                    >
                        자세히 보기 <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </div>
    )
}
