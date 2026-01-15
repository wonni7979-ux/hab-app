'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Pencil, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Category {
    id: string
    name: string
    icon: string
    color: string
    type: 'expense' | 'income'
    user_id?: string
}

const PRESET_COLORS = [
    '#1da1f2', '#34d399', '#fbbf24', '#f87171', '#a78bfa',
    '#ec4899', '#f97316', '#64748b', '#06b6d4', '#8b5cf6'
]

const PRESET_ICONS = ['🍴', '🚌', '🛍️', '🎬', '🏠', '🎁', '💊', '📚', '☕', '📦', '💰', '📈', '🎟️', '🍕']

export default function CategoryManagementPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [type, setType] = useState<'expense' | 'income'>('expense')

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null)
    const [name, setName] = useState('')
    const [icon, setIcon] = useState('📦')
    const [color, setColor] = useState('#1da1f2')

    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories', type],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('type', type)
                .order('name')
            if (error) throw error
            return data as Category[]
        }
    })

    const upsertMutation = useMutation({
        mutationFn: async (category: Partial<Category>) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('로그인이 필요합니다.')

            const payload = {
                ...category,
                user_id: user.id,
                type: type // 현재 탭의 타입을 따름
            }

            if (category.id) {
                // UPDATE: Remove id from payload as it's used in the .eq() filter
                const { id: _id, ...updateData } = payload
                const { error } = await supabase
                    .from('categories')
                    .update(updateData)
                    .eq('id', category.id)
                if (error) throw error
            } else {
                // INSERT: Strip id entirely to avoid PostgREST parsing 'id: undefined' as a column
                const insertData = {
                    name: payload.name,
                    icon: payload.icon,
                    color: payload.color,
                    type: payload.type,
                    user_id: payload.user_id
                }
                const { error } = await supabase
                    .from('categories')
                    .insert([insertData])
                if (error) throw error
            }
        },
        onSuccess: () => {
            toast.success(editingCategory?.id ? '카테고리가 수정되었습니다.' : '새 카테고리가 추가되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            setIsDialogOpen(false)
            resetForm()
        },
        onError: (err: any) => {
            toast.error('저장 실패: ' + err.message)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('categories').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('카테고리가 삭제되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (err: any) => {
            toast.error('삭제 실패: ' + err.message)
        }
    })

    const resetForm = () => {
        setEditingCategory(null)
        setName('')
        setIcon('📦')
        setColor('#1da1f2')
    }

    const handleEdit = (cat: Category) => {
        setEditingCategory(cat)
        setName(cat.name)
        setIcon(cat.icon || '📦')
        setColor(cat.color || '#1da1f2')
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
            id: editingCategory?.id,
            name,
            icon,
            color
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
                    <h1 className="text-xl font-bold text-white">카테고리 관리</h1>
                </div>
                <button onClick={handleAdd} className="text-primary p-2 hover:bg-primary/10 rounded-full transition-colors">
                    <Plus size={24} />
                </button>
            </header>

            <Tabs defaultValue="expense" onValueChange={(v) => setType(v as any)} className="w-full px-6">
                <TabsList className="w-full bg-slate-800/30 p-1 rounded-xl mb-8">
                    <TabsTrigger value="expense" className="flex-1 rounded-lg text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">지출</TabsTrigger>
                    <TabsTrigger value="income" className="flex-1 rounded-lg text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">수입</TabsTrigger>
                </TabsList>

                <TabsContent value={type} className="mt-0 space-y-3 focus-visible:outline-none">
                    {categories?.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div
                                    className="h-10 w-10 rounded-full flex items-center justify-center text-lg"
                                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                >
                                    {cat.icon || '📦'}
                                </div>
                                <span className="text-[15px] font-bold text-white">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleEdit(cat)}
                                    className="p-2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('정말 삭제하시겠습니까?')) {
                                            deleteMutation.mutate(cat.id)
                                        }
                                    }}
                                    className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {!categories?.length && (
                        <p className="text-center py-12 text-slate-500 text-sm italic">등록된 카테고리가 없습니다.</p>
                    )}
                </TabsContent>
            </Tabs>


            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[90vw] w-[400px] rounded-3xl bg-slate-900 border-white/5 p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">
                            {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                            수입/지출 내역을 분류할 카테고리 정보를 관리합니다.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">이름</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="카테고리 이름을 입력하세요"
                                    className="bg-slate-800 border-white/5 text-white h-12 rounded-xl focus:border-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">아이콘 선택</Label>
                                <div className="grid grid-cols-7 gap-2">
                                    {PRESET_ICONS.map((i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setIcon(i)}
                                            className={cn(
                                                "h-10 w-10 flex items-center justify-center rounded-xl text-xl transition-all",
                                                icon === i ? "bg-primary text-white scale-110" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                            )}
                                        >
                                            {i}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">색상 선택</Label>
                                <div className="grid grid-cols-5 gap-3">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                "h-8 w-full rounded-full transition-all border-2",
                                                color === c ? "border-white scale-110 shadow-lg" : "border-transparent"
                                            )}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
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
                                {upsertMutation.isPending ? '저장 중...' : (editingCategory ? '수정 완료' : '추가하기')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
