'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, BellRing, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function AdminAnnouncementsPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    const { data: announcements, isLoading } = useQuery({
        queryKey: ['admin_announcements'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) {
                toast.error('DB 테이블이 존재하지 않습니다. SQL 스크립트를 먼저 실행해주세요.')
                // Fallback to empty array to prevent crash
                return [];
            }
            return data
        }
    })

    const upsertMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await supabase.from('announcements').insert([{
                title: payload.title,
                content: payload.content,
                created_by: user?.id
            }])
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('공지사항이 등록되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['admin_announcements'] })
            setIsDialogOpen(false)
            setTitle('')
            setContent('')
        },
        onError: (err: any) => toast.error('저장 실패: ' + err.message)
    })

    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
            const { error } = await supabase.from('announcements').update({ is_active }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_announcements'] })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('announcements').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('삭제되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['admin_announcements'] })
        }
    })

    if (isLoading) return <div className="p-8 text-center text-slate-500">불러오는 중...</div>

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BellRing className="text-amber-500 w-5 h-5" />
                    <h2 className="text-lg font-bold text-slate-800">공지사항 및 시스템 알림</h2>
                </div>
                <button onClick={() => setIsDialogOpen(true)} className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                    <Plus size={16} /> 새 공지
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {announcements?.map((notice: any) => (
                        <div key={notice.id} className="flex flex-col p-4 hover:bg-slate-50 transition-colors gap-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${notice.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                    {notice.title}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleActiveMutation.mutate({ id: notice.id, is_active: !notice.is_active })}
                                        className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-md transition-colors text-xs font-bold"
                                    >
                                        {notice.is_active ? '비활성화' : '활성화'}
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate(notice.id) }}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500 whitespace-pre-wrap pl-4 border-l-2 border-slate-100">
                                {notice.content}
                            </div>
                        </div>
                    ))}
                    {!announcements?.length && (
                        <div className="p-8 text-center text-slate-400 text-sm">등록된 공지사항이 없습니다.</div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[400px] w-[90vw] rounded-3xl bg-white border-none p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800">새 공지사항 작성</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs text-left">
                            은행 점검이나 시스템 패치 등 사용자의 메인 대시보드에 띄울 중요한 메시지를 작성하세요.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">제목 (예: 신한은행 연동 오류 안내)</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-50 border-slate-200" placeholder="공지 제목" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">내용</Label>
                            <textarea 
                                value={content} 
                                onChange={(e) => setContent(e.target.value)} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 resize-none h-24" 
                                placeholder="오류 원인 및 복구 예정 시간 등을 기록하세요" 
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 text-slate-500 rounded-xl">취소</Button>
                        <Button onClick={() => upsertMutation.mutate({ title, content })} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl" disabled={upsertMutation.isPending}>배포</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
