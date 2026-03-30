'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function AdminCategoriesPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [name, setName] = useState('')
    const [icon, setIcon] = useState('📦')
    const [type, setType] = useState<'expense' | 'income'>('expense')

    const { data: categories, isLoading } = useQuery({
        queryKey: ['admin_categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .is('user_id', null) // Fetch only global/standard categories
                .order('name')
            if (error) {
                // Fallback to all categories if user_id doesn't exist
                const { data: fallback, error: err2 } = await supabase.from('categories').select('*').order('name')
                if (err2) throw err2;
                return fallback;
            }
            return data
        }
    })

    const upsertMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { error } = await supabase.from('categories').insert([{
                name: payload.name,
                icon: payload.icon,
                type: payload.type,
                color: '#64748b' // Default standard color
            }])
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('표준 카테고리가 추가되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['admin_categories'] })
            setIsDialogOpen(false)
            setName('')
        },
        onError: (err: any) => toast.error('저장 실패: ' + err.message)
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('categories').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('카테고리가 삭제되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['admin_categories'] })
        }
    })

    const handleAdd = () => {
        setIsDialogOpen(true)
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500">불러오는 중...</div>

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Tags className="text-blue-500 w-5 h-5" />
                    <h2 className="text-lg font-bold text-slate-800">표준 카테고리 관리</h2>
                </div>
                <button onClick={handleAdd} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                    <Plus size={16} /> 추가
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {categories?.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="text-xl bg-slate-100 w-10 h-10 flex items-center justify-center rounded-xl">{cat.icon || '📦'}</div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">{cat.name}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">{cat.type === 'expense' ? '지출' : '수입'}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => { if (confirm('정말 삭제하시겠습니까? 글로벌 카테고리 삭제 시 사용자 데이터에 영향을 줄 수 있습니다.')) deleteMutation.mutate(cat.id) }}
                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {!categories?.length && (
                        <div className="p-8 text-center text-slate-400 text-sm">등록된 표준 카테고리가 없습니다.</div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[400px] w-[90vw] rounded-3xl bg-white border-none p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800">새 표준 카테고리</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs text-left">
                            모든 사용자에게 기본으로 제공될 카테고리를 추가합니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">이름</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 border-slate-200" placeholder="카테고리명" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">분류</Label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${type === 'expense' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>지출</button>
                                <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${type === 'income' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>수입</button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 text-slate-500 rounded-xl">취소</Button>
                        <Button onClick={() => upsertMutation.mutate({ name, icon, type })} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl" disabled={upsertMutation.isPending}>저장</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
