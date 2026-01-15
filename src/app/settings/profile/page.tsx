'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, User, Camera, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface Profile {
    id: string
    display_name: string | null
    avatar_url: string | null
    email: string | null
}

export default function ProfileEditPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    const [displayName, setDisplayName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('로그인이 필요합니다.')

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error
            return data as Profile
        }
    })

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '')
            setAvatarUrl(profile.avatar_url || '')
        }
    }, [profile])

    const updateProfileMutation = useMutation({
        mutationFn: async (updatedData: Partial<Profile>) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('로그인이 필요합니다.')

            const { error } = await supabase
                .from('profiles')
                .update(updatedData)
                .eq('id', user.id)

            if (error) throw error
        },
        onSuccess: () => {
            toast.success('프로필이 업데이트되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['profile'] })
        },
        onError: (err: any) => {
            toast.error('업데이트 실패: ' + err.message)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateProfileMutation.mutate({
            display_name: displayName,
            avatar_url: avatarUrl
        })
    }

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="text-primary animate-spin" size={32} />
        </div>
    )

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            <header className="flex items-center gap-4 p-6">
                <Link href="/settings">
                    <ArrowLeft className="text-white" size={24} />
                </Link>
                <h1 className="text-xl font-bold text-white">프로필 수정</h1>
            </header>

            <div className="px-6 space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt="Avatar"
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <User size={40} className="text-slate-600" />
                            )}
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white border-4 border-background hover:scale-110 transition-transform">
                            <Camera size={16} />
                        </button>
                    </div>
                    <p className="text-sm font-bold text-slate-400">{profile?.email}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">닉네임</Label>
                            <Input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="사용할 이름을 입력하세요"
                                className="bg-slate-900/40 border-white/5 text-white h-14 rounded-2xl focus:border-primary/50 text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">프로필 이미지 URL</Label>
                            <Input
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="이미지 주소를 입력하세요"
                                className="bg-slate-900/40 border-white/5 text-white h-14 rounded-2xl focus:border-primary/50 text-sm"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {updateProfileMutation.isPending ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <Check size={20} />
                        )}
                        저장하기
                    </Button>
                </form>

                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                    <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        💡 팁
                    </p>
                    <p className="text-[13px] text-slate-400 leading-relaxed">
                        닉네임을 설정하면 AI 리포트 등에서 사용자님을 더 친근하게 불러드릴 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    )
}
