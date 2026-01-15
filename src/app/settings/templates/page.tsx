'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Zap, Wallet, Tag } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Template {
    id: string
    name: string
    type: 'expense' | 'income' | 'transfer'
    amount: number
    category_id: string | null
    payment_method_id: string
    description: string | null
}

export default function TemplatesPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState<Partial<Template>>({
        name: '',
        type: 'expense',
        amount: 0,
        category_id: null,
        payment_method_id: '',
        description: ''
    })

    const { data: templates, isLoading } = useQuery({
        queryKey: ['transaction-templates'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return []
            const { data, error } = await supabase
                .from('transaction_templates')
                .select(`
                    *,
                    categories(name, icon, color),
                    payment_methods(name)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        }
    })

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await supabase.from('categories').select('*').order('name')
            return data || []
        }
    })

    const { data: paymentMethods } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: async () => {
            const { data } = await supabase.from('payment_methods').select('*').order('name')
            return data || []
        }
    })

    const upsertMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const data = { ...payload, user_id: user.id }
            if (payload.id) {
                const { error } = await supabase
                    .from('transaction_templates')
                    .update(data)
                    .eq('id', payload.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('transaction_templates')
                    .insert([data])
                if (error) throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transaction-templates'] })
            toast.success('템플릿이 저장되었습니다.')
            setIsAdding(false)
            setEditingId(null)
            setFormData({ name: '', type: 'expense', amount: 0, category_id: null, payment_method_id: '', description: '' })
        },
        onError: (error: any) => {
            toast.error('저장 중 오류가 발생했습니다: ' + error.message)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('transaction_templates').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transaction-templates'] })
            toast.success('템플릿이 삭제되었습니다.')
        }
    })

    const handleEdit = (template: Template) => {
        setEditingId(template.id)
        setFormData(template)
        setIsAdding(true)
    }

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            <header className="flex items-center justify-between p-6 sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-white/5">
                <Link href="/settings">
                    <div className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="text-white" size={24} />
                    </div>
                </Link>
                <h1 className="text-xl font-black text-white tracking-tight">반복 거래 (템플릿)</h1>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding)
                        setEditingId(null)
                        setFormData({ name: '', type: 'expense', amount: 0, category_id: null, payment_method_id: '', description: '' })
                    }}
                    className="p-2 bg-primary text-white rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                    {isAdding ? <X size={24} /> : <Plus size={24} />}
                </button>
            </header>

            <div className="px-6 py-6 space-y-6">
                {isAdding && (
                    <Card className="bg-slate-900/60 border-primary/20 animate-in zoom-in-95 duration-300">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-2">
                                {editingId ? '템플릿 수정' : '새 템플릿 추가'}
                            </h3>
                            <div className="space-y-4">
                                <Input
                                    placeholder="템플릿 이름 (예: 월세, 통신비)"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-background border-white/5 text-white h-12 rounded-xl"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    {['expense', 'income', 'transfer'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({ ...formData, type: type as any })}
                                            className={cn(
                                                "py-2 rounded-xl text-xs font-bold transition-all border",
                                                formData.type === type
                                                    ? "bg-primary border-primary text-white"
                                                    : "bg-background border-white/5 text-slate-500"
                                            )}
                                        >
                                            {type === 'expense' ? '지출' : type === 'income' ? '수입' : '이체'}
                                        </button>
                                    ))}
                                </div>
                                <Input
                                    type="number"
                                    placeholder="금액"
                                    value={formData.amount || ''}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    className="bg-background border-white/5 text-white h-12 rounded-xl"
                                />
                                <Select
                                    value={formData.payment_method_id || ''}
                                    onValueChange={(v) => setFormData({ ...formData, payment_method_id: v })}
                                >
                                    <SelectTrigger className="bg-background border-white/5 text-white h-12 rounded-xl">
                                        <SelectValue placeholder="결제 수단 선택" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10">
                                        {paymentMethods?.map((m: any) => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formData.type !== 'transfer' && (
                                    <Select
                                        value={formData.category_id || ''}
                                        onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                                    >
                                        <SelectTrigger className="bg-background border-white/5 text-white h-12 rounded-xl">
                                            <SelectValue placeholder="카테고리 선택" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10">
                                            {categories?.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Input
                                    placeholder="설명 (메모)"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-background border-white/5 text-white h-12 rounded-xl"
                                />
                                <Button
                                    onClick={() => upsertMutation.mutate(formData)}
                                    className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90"
                                    disabled={!formData.name || !formData.payment_method_id}
                                >
                                    {editingId ? '수정 완료' : '템플릿 만들기'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4">
                    {isLoading ? (
                        <p className="text-center text-slate-500 py-10">로딩 중...</p>
                    ) : templates?.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <Zap className="mx-auto text-slate-800" size={48} />
                            <p className="text-slate-500 font-medium">등록된 반복 거래가 없습니다.<br />새로운 템플릿을 추가해보세요!</p>
                        </div>
                    ) : (
                        templates?.map((template: any) => (
                            <div
                                key={template.id}
                                className="group bg-slate-900/40 backdrop-blur-md border border-white/5 p-5 rounded-[28px] hover:bg-slate-800/60 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 rounded-full flex items-center justify-center text-lg"
                                            style={{
                                                backgroundColor: template.type === 'transfer' ? '#47556920' : `${template.categories?.color}20`,
                                                color: template.type === 'transfer' ? '#94a3b8' : template.categories?.color
                                            }}
                                        >
                                            {template.type === 'transfer' ? '🔄' : (template.categories?.icon || '📦')}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black text-base">{template.name}</h4>
                                            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                                {template.type === 'expense' ? '지출' : template.type === 'income' ? '수입' : '이체'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('템플릿을 삭제하시겠습니까?')) deleteMutation.mutate(template.id)
                                            }}
                                            className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm font-medium">자동 입력 금액</span>
                                        <span className="text-white font-black">₩{template.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                            <Wallet size={12} />
                                            <span>{template.payment_methods?.name}</span>
                                        </div>
                                        {template.type !== 'transfer' && (
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                                <Tag size={12} />
                                                <span>{template.categories?.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
