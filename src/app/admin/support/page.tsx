'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { MessageSquareText, CheckCircle2, Clock, Inbox, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function AdminSupportPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [replyText, setReplyText] = useState<string>('')

    const { data: messages, isLoading } = useQuery({
        queryKey: ['admin_support_messages'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('support_messages')
                .select(`
                    id,
                    user_id,
                    message,
                    reply,
                    status,
                    created_at,
                    updated_at,
                    users:user_id (email)
                `)
                .order('status', { ascending: false }) // 'pending' comes before 'resolved' usually alphabetically (p > r), so pending first
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        }
    })

    const replyMutation = useMutation({
        mutationFn: async ({ id, reply }: { id: string, reply: string }) => {
            const { error } = await supabase
                .from('support_messages')
                .update({ 
                    reply, 
                    status: 'resolved', 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            toast.success('답변이 성공적으로 등록되었습니다.')
            setReplyText('')
            setExpandedId(null)
            queryClient.invalidateQueries({ queryKey: ['admin_support_messages'] })
        },
        onError: () => {
            toast.error('답변 등록에 실패했습니다.')
        }
    })

    if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">문의 내역을 불러오는 중...</div>

    const pendingCount = messages?.filter(m => m.status === 'pending').length || 0
    const resolvedCount = messages?.filter(m => m.status === 'resolved').length || 0

    return (
        <div className="p-4 space-y-6 pb-20">
            <div className="flex items-center gap-2 mb-2">
                <MessageSquareText className="text-indigo-500 w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-800">1:1 고객 문의 관리 (CS)</h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col gap-1">
                    <span className="text-amber-800 text-xs font-bold flex items-center gap-1">
                        <Clock size={12} /> 답변 대기
                    </span>
                    <span className="text-2xl font-black text-amber-600">{pendingCount}건</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col gap-1">
                    <span className="text-emerald-800 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> 처리 완료
                    </span>
                    <span className="text-2xl font-black text-emerald-600">{resolvedCount}건</span>
                </div>
            </div>

            {/* Messages List */}
            <div className="space-y-4">
                {messages?.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-slate-400">
                        <Inbox size={32} className="mb-2 opacity-50" />
                        <p className="text-sm font-bold">접수된 문의가 없습니다.</p>
                    </div>
                ) : (
                    messages?.map(msg => {
                        const isExpanded = expandedId === msg.id
                        const isPending = msg.status === 'pending'
                        
                        return (
                            <div key={msg.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                                {/* Header (Clickable) */}
                                <div 
                                    className={`p-4 flex gap-4 items-start cursor-pointer hover:bg-slate-50 ${isExpanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
                                    onClick={() => {
                                        setExpandedId(isExpanded ? null : msg.id)
                                        setReplyText(msg.reply || '')
                                    }}
                                >
                                    <div className="mt-1">
                                        {isPending ? (
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                        ) : (
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-slate-500 truncate pr-2">
                                                {msg.users?.email || '알 수 없는 사용자'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                {format(new Date(msg.created_at), 'MM/dd HH:mm')}
                                            </span>
                                        </div>
                                        <p className={`text-sm text-slate-700 leading-relaxed ${!isExpanded && 'line-clamp-2'}`}>
                                            {msg.message}
                                        </p>
                                    </div>
                                    <div className="text-slate-400 mt-2">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                                {/* Expanded Content (Reply Form) */}
                                {isExpanded && (
                                    <div className="p-4 bg-slate-50/50 space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                                                <MessageSquareText size={14} /> 관리자 답변 작성
                                            </label>
                                            <Textarea 
                                                value={replyText}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
                                                placeholder="사용자에게 전달할 답변을 입력하세요..."
                                                className="min-h-[100px] text-sm bg-white border-indigo-100 focus-visible:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            {msg.reply && isPending === false && (
                                                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mr-auto">
                                                    <CheckCircle2 size={12} /> 이미 답변이 완료된 문의입니다. (수정 가능)
                                                </span>
                                            )}
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => setExpandedId(null)}
                                                className="rounded-xl border-slate-200"
                                            >
                                                닫기
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                onClick={() => {
                                                    if (!replyText.trim()) return toast.error('답변 내용을 입력해주세요.')
                                                    replyMutation.mutate({ id: msg.id, reply: replyText.trim() })
                                                }}
                                                disabled={replyMutation.isPending}
                                                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                {replyMutation.isPending ? '전송 중...' : (isPending ? '답변 등록' : '답변 수정')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
