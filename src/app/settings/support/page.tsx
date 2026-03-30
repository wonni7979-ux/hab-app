'use client'

import { useState } from 'react'
import { ArrowLeft, Send, MessageSquareDashed, Clock, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function SupportPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [message, setMessage] = useState('')

    // Fetch user's previous support messages
    const { data: messages, isLoading } = useQuery({
        queryKey: ['support_messages_user'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not logged in')

            const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        }
    })

    // Mutation to submit a new message
    const submitMessage = useMutation({
        mutationFn: async (msgText: string) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not logged in')

            const { error } = await supabase
                .from('support_messages')
                .insert([{ user_id: user.id, message: msgText }])

            if (error) throw error
        },
        onSuccess: () => {
            toast.success('문의가 정상적으로 접수되었습니다!')
            setMessage('')
            queryClient.invalidateQueries({ queryKey: ['support_messages_user'] })
        },
        onError: () => {
            toast.error('문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
    })

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
            <header className="flex items-center gap-4 p-6 bg-slate-900 sticky top-0 z-10 shadow-sm">
                <Link href="/settings">
                    <ArrowLeft className="text-white hover:text-slate-300 transition-colors" size={24} />
                </Link>
                <h1 className="text-xl font-bold text-white tracking-tight">고객 센터 / 문의하기</h1>
            </header>

            <main className="p-4 space-y-6 mt-2 max-w-2xl mx-auto w-full">
                {/* 1. New Message Form */}
                <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquareDashed className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-[15px] font-bold text-slate-800">관리자에게 문의 남기기</h2>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-1">
                        서비스 이용 중 불편하신 점이나 개선 사항이 있다면 자유롭게 남겨주세요.
                        관리자가 확인 후 답변을 달아드립니다.
                    </p>
                    
                    <Textarea 
                        placeholder="문의하실 내용을 입력해주세요..."
                        className="min-h-[120px] bg-slate-50 border-slate-200 text-sm resize-none focus-visible:ring-indigo-500"
                        value={message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                        disabled={submitMessage.isPending}
                    />

                    <Button 
                        onClick={() => {
                            if (!message.trim()) return toast.error('내용을 입력해주세요.')
                            submitMessage.mutate(message.trim())
                        }}
                        disabled={submitMessage.isPending}
                        className="w-full h-12 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all mt-1 flex items-center gap-2"
                    >
                        <Send size={16} /> 
                        {submitMessage.isPending ? '전송 중...' : '문의 보내기'}
                    </Button>
                </section>

                {/* 2. Message History */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 px-1 border-b border-slate-200 pb-2">나의 문의 내역</h3>
                    
                    {isLoading ? (
                        <div className="text-center text-sm text-slate-400 py-8 animate-pulse">문의 내역을 불러오는 중...</div>
                    ) : messages?.length === 0 ? (
                        <div className="text-center bg-white p-8 rounded-2xl border border-slate-200 border-dashed text-slate-400 text-sm">
                            등록된 문의 내역이 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages?.map((msg) => (
                                <div key={msg.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                    {/* User's Message */}
                                    <div className="p-4 bg-slate-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-1.5 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                <UserIcon size={10} /> 나의 문의
                                            </div>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock size={10} /> 
                                                {format(new Date(msg.created_at), 'PPP a p', { locale: ko })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                            {msg.message}
                                        </p>
                                    </div>
                                    
                                    {/* Admin's Reply */}
                                    <div className="p-4 border-t border-slate-100 bg-white">
                                        <div className="flex items-center gap-2 mb-2">
                                            {msg.status === 'resolved' ? (
                                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase">답변 완료</span>
                                            ) : (
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase">답변 대기 중</span>
                                            )}
                                        </div>
                                        
                                        {msg.reply ? (
                                            <div className="bg-indigo-50/50 border border-indigo-100/50 p-3 rounded-xl mt-2">
                                                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                                    {msg.reply}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-2 text-right">관리자 답변</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">아직 관리자의 답변이 등록되지 않았습니다.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
