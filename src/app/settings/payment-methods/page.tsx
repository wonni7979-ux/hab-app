'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, CreditCard, Landmark, Wallet, Search, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from '@/lib/utils'

interface PaymentMethod {
    id: string
    name: string
    user_id?: string
}

export default function PaymentMethodManagementPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethod> | null>(null)
    const [name, setName] = useState('')

    const { data: methods, isLoading } = useQuery({
        queryKey: ['payment_methods'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .order('name')
            if (error) throw error
            return data as PaymentMethod[]
        }
    })

    const upsertMutation = useMutation({
        mutationFn: async (method: Partial<PaymentMethod>) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('로그인이 필요합니다.')

            const payload = {
                ...method,
                user_id: user.id
            }

            if (method.id) {
                const { error } = await supabase
                    .from('payment_methods')
                    .update(payload)
                    .eq('id', method.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('payment_methods')
                    .insert([payload])
                if (error) throw error
            }
        },
        onSuccess: () => {
            toast.success(editingMethod?.id ? '결제 수단이 수정되었습니다.' : '새 결제 수단이 추가되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['payment_methods'] })
            setIsDialogOpen(false)
            resetForm()
        },
        onError: (err: any) => {
            toast.error('저장 실패: ' + err.message)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('payment_methods').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('결제 수단이 삭제되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['payment_methods'] })
        },
        onError: (err: any) => {
            toast.error('삭제 실패: ' + err.message)
        }
    })

    const resetForm = () => {
        setEditingMethod(null)
        setName('')
    }

    const handleEdit = (m: PaymentMethod) => {
        setEditingMethod(m)
        setName(m.name)
        setIsDialogOpen(true)
    }

    const handleAdd = () => {
        resetForm()
        setIsDialogOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error('이름을 입력해 주세요.')
            return
        }
        upsertMutation.mutate({
            id: editingMethod?.id,
            name
        })
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">불러오는 중...</div>

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            <header className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                    <Link href="/settings">
                        <ArrowLeft className="text-white" size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-white">결제 수단 관리</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleAdd} className="text-primary p-2 hover:bg-primary/10 rounded-full transition-colors">
                        <Plus size={24} />
                    </button>
                    <button className="text-slate-400 p-2">
                        <Search size={22} />
                    </button>
                </div>
            </header>

            <div className="px-6 space-y-6">
                <div className="space-y-4">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">연동된 수단</h2>

                    {methods?.map((m) => (
                        <Card key={m.id} className="border-none bg-slate-900/40 shadow-xl overflow-hidden group">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        {m.name.includes('카드') ? <CreditCard size={24} /> : m.name.includes('통장') ? <Landmark size={24} /> : <Wallet size={24} />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[15px] font-bold text-white leading-tight">{m.name}</p>
                                        <p className="text-xs font-medium text-slate-500">
                                            {m.name.includes('카드') ? '신용카드' : m.name.includes('통장') ? '계좌 • • • • 1234' : '현금'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(m)}
                                        className="p-2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('정말 삭제하시겠습니까?')) {
                                                deleteMutation.mutate(m.id)
                                            }
                                        }}
                                        className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {!methods?.length && (
                        <div className="py-12 flex flex-col items-center justify-center space-y-6 bg-slate-900/40 rounded-3xl border border-white/5 mx-2">
                            <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                                <CreditCard size={40} className="opacity-20 translate-y-1 translate-x-1" />
                                <Plus size={20} className="absolute opacity-40" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-bold text-white">결제 수단이 없어요</h3>
                                <p className="text-sm font-medium text-slate-500">첫 결제 수단을 등록하고 지출을 관리해보세요.</p>
                            </div>
                            <Button
                                onClick={handleAdd}
                                className="rounded-full bg-white text-slate-900 hover:bg-slate-100 px-8 font-black"
                            >
                                결제 수단 추가하기
                            </Button>
                        </div>
                    )}
                </div>
            </div>


            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[90vw] w-[400px] rounded-3xl bg-slate-900 border-white/5 p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">
                            {editingMethod ? '결제 수단 수정' : '새 결제 수단 추가'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">이름</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="예: 현대카드, 주거래 통장, 현금 등"
                                    className="bg-slate-800 border-white/5 text-white h-12 rounded-xl focus:border-primary/50"
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex gap-3 sm:justify-end pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="flex-1 sm:flex-none text-slate-400 font-bold h-12 rounded-xl"
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 sm:flex-none bg-primary text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20"
                                disabled={upsertMutation.isPending}
                            >
                                {upsertMutation.isPending ? '저장 중...' : (editingMethod ? '수정 완료' : '추가하기')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
