'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { PiggyBank } from 'lucide-react'
import { updatePassword } from './actions'
import Link from 'next/link'

export default function UpdatePasswordPage() {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        
        const result = await updatePassword(formData)

        if (result && 'error' in result && result.error) {
            toast.error(result.error)
            setIsLoading(false)
        }
        // Valid response redirects automatically in the server action
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px]" />

            <div className="mb-10 flex flex-col items-center gap-4 z-10">
                <div className="p-4 rounded-3xl bg-primary text-white shadow-[0_0_30px_rgba(29,161,242,0.4)] transition-transform hover:scale-110">
                    <PiggyBank size={40} />
                </div>
                <div className="text-center space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-white">모두의 가계부</h1>
                </div>
            </div>

            <Card className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl z-10 overflow-hidden rounded-3xl pb-4">
                <CardHeader className="text-center pb-2 pt-8">
                    <CardTitle className="text-xl font-bold text-white">새 비밀번호 설정</CardTitle>
                    <CardDescription className="text-slate-400">
                        안전한 계정 사용을 위해 새로운 비밀번호를 입력해주세요.
                    </CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <CardContent className="space-y-5 pt-4 px-8">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">새 비밀번호</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                className="h-12 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white rounded-xl"
                                placeholder="최소 6자리 이상"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">새 비밀번호 확인</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                className="h-12 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white rounded-xl"
                                placeholder="비밀번호 다시 입력"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 p-8 pt-4">
                        <Button className="w-full h-14 text-base font-black rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg transition-all active:scale-95" type="submit" disabled={isLoading}>
                            {isLoading ? '설정 중...' : '비밀번호 변경하기'}
                        </Button>
                        <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                            로그인 화면으로 돌아가기
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
