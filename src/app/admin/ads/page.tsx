'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Megaphone, Target } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function AdminAdsPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [clickUrl, setClickUrl] = useState('')
    const [threshold, setThreshold] = useState('100000')

    const { data: ads, isLoading } = useQuery({
        queryKey: ['admin_ads'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('advertisements')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) {
                toast.error('광고 DB 테이블이 존재하지 않습니다. SQL 스크립트를 먼저 실행해주세요.')
                // Fallback to empty array to prevent crash
                return [];
            }
            return data
        }
    })

    const upsertMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { error } = await supabase.from('advertisements').insert([{
                title: payload.title,
                description: payload.description,
                click_url: payload.click_url,
                target_category_type: 'expense',
                target_amount_threshold: Number(payload.threshold)
            }])
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('타겟팅 광고가 등록되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['admin_ads'] })
            setIsDialogOpen(false)
            setTitle('')
            setDescription('')
            setClickUrl('')
        },
        onError: (err: any) => toast.error('저장 실패: ' + err.message)
    })

    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
            const { error } = await supabase.from('advertisements').update({ is_active }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_ads'] })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('advertisements').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('삭제되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['admin_ads'] })
        }
    })

    if (isLoading) return <div className="p-8 text-center text-slate-500">불러오는 중...</div>

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Megaphone className="text-fuchsia-500 w-5 h-5" />
                    <h2 className="text-lg font-bold text-slate-800">타겟팅 광고 센터 (수익화)</h2>
                </div>
                <button onClick={() => setIsDialogOpen(true)} className="bg-fuchsia-50 text-fuchsia-600 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                    <Plus size={16} /> 새 광고
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {ads?.map((ad: any) => (
                        <div key={ad.id} className="flex flex-col p-4 hover:bg-slate-50 transition-colors gap-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${ad.is_active ? 'bg-fuchsia-500' : 'bg-slate-300'}`} />
                                    {ad.title}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleActiveMutation.mutate({ id: ad.id, is_active: !ad.is_active })}
                                        className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-md transition-colors text-xs font-bold"
                                    >
                                        {ad.is_active ? '정지' : '게재'}
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate(ad.id) }}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500">
                                {ad.description}
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 mt-1 flex items-center gap-2 text-xs font-bold text-slate-600">
                                <Target className="w-3.5 h-3.5 text-blue-500" />
                                조건: {ad.target_category_type === 'expense' ? '지출' : '수입'} {Number(ad.target_amount_threshold).toLocaleString()}원 초과 시 노출
                            </div>
                        </div>
                    ))}
                    {!ads?.length && (
                        <div className="p-8 text-center text-slate-400 text-sm">등록된 타겟팅 광고가 없습니다.</div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[400px] w-[90vw] rounded-3xl bg-white border-none p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800">새 타겟팅 상품/광고 등록</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs text-left">
                            사용자의 소비 패턴에 맞춰 노출될 맞춤형 금융 상품이나 파트너사 광고를 설정합니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">광고명 (예: 신한 RPM+ 카드 추천)</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-50 border-slate-200" placeholder="상품 또는 프로모션명" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">광고 문구</Label>
                            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-slate-50 border-slate-200" placeholder="예: 주유비가 많이 나오시네요, 이 카드는 어떠세요?" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">목표 지출 임계값 (원)</Label>
                            <Input value={threshold} type="number" onChange={(e) => setThreshold(e.target.value)} className="bg-slate-50 border-slate-200" placeholder="100000" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">연결할 링크 (URL)</Label>
                            <Input value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} className="bg-slate-50 border-slate-200" placeholder="https://..." />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 text-slate-500 rounded-xl">취소</Button>
                        <Button onClick={() => upsertMutation.mutate({ title, description, click_url: clickUrl, threshold })} className="flex-1 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-xl" disabled={upsertMutation.isPending}>게재</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
