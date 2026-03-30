'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function AdminPaymentsPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [name, setName] = useState('')

    const { data: payments, isLoading } = useQuery({
        queryKey: ['admin_payments'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .is('user_id', null) // Only global
                .order('name')
            if (error) {
                const { data: fallback, error: err2 } = await supabase.from('payment_methods').select('*').order('name')
                if (err2) throw err2;
                return fallback;
            }
            return data
        }
    })

    const upsertMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { error } = await supabase.from('payment_methods').insert([{
                name: payload.name,
            }])
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('표준 결제 수단이 추가되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['admin_payments'] })
            setIsDialogOpen(false)
            setName('')
        },
        onError: (err: any) => toast.error('저장 실패: ' + err.message)
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('payment_methods').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('결제 수단이 삭제되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['admin_payments'] })
        }
    })

    if (isLoading) return <div className="p-8 text-center text-slate-500">불러오는 중...</div>

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CreditCard className="text-violet-500 w-5 h-5" />
                    <h2 className="text-lg font-bold text-slate-800">결제 수단 관리</h2>
                </div>
                <button onClick={() => setIsDialogOpen(true)} className="bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                    <Plus size={16} /> 추가
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {payments?.map((pm) => (
                        <div key={pm.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                            <div className="text-sm font-bold text-slate-800">{pm.name}</div>
                            <button
                                onClick={() => { if (confirm('정말 삭제하시겠습니까? 사용자 데이터에 영향을 줄 수 있습니다.')) deleteMutation.mutate(pm.id) }}
                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {!payments?.length && (
                        <div className="p-8 text-center text-slate-400 text-sm">등록된 결제 수단이 없습니다.</div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[400px] w-[90vw] rounded-3xl bg-white border-none p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800">새 결제 수단</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs text-left">
                            모든 사용자에게 기본으로 제공될 결제 수단(은행/카드사 등)을 추가합니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">이름 (예: 신한카드, 네이버페이)</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 border-slate-200" placeholder="결제 수단명" />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 text-slate-500 rounded-xl">취소</Button>
                        <Button onClick={() => upsertMutation.mutate({ name })} className="flex-1 bg-violet-500 hover:bg-violet-600 text-white rounded-xl" disabled={upsertMutation.isPending}>저장</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
