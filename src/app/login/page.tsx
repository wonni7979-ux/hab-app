'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { PiggyBank } from 'lucide-react'

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData, mode: 'login' | 'signup') {
        setIsLoading(true)
        const result = mode === 'login' ? await login(formData) : await signup(formData)

        if (result && 'error' in result && result.error) {
            toast.error(result.error)
        } else if (result && 'success' in result && result.success) {
            toast.success(result.success)
        }
        setIsLoading(false)
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
                    <h1 className="text-3xl font-black tracking-tight text-white">더더 간단한 가계부</h1>
                    <p className="text-slate-400 font-medium text-sm">나의 소중한 자산 관리, 지금 시작하세요.</p>
                </div>
            </div>

            <Card className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl z-10 overflow-hidden rounded-3xl">
                <Tabs defaultValue="login" className="w-full">
                    <CardHeader className="p-1">
                        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-800/30 h-14 p-1">
                            <TabsTrigger
                                value="login"
                                className="rounded-xl text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                            >
                                로그인
                            </TabsTrigger>
                            <TabsTrigger
                                value="signup"
                                className="rounded-xl text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                            >
                                회원가입
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>

                    <TabsContent value="login" className="mt-0">
                        <form action={(fd) => handleSubmit(fd, 'login')}>
                            <CardContent className="space-y-5 pt-8 px-8">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">이메일</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="hello@example.com"
                                        className="h-12 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">비밀번호</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        className="h-12 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white rounded-xl"
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4 p-8 pt-4">
                                <Button className="w-full h-14 text-base font-black rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg transition-all active:scale-95" type="submit" disabled={isLoading}>
                                    {isLoading ? '로그인 중...' : '로그인'}
                                </Button>
                                <Button variant="link" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors" type="button">
                                    비밀번호를 잊으셨나요?
                                </Button>
                            </CardFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup" className="mt-0">
                        <form action={(fd) => handleSubmit(fd, 'signup')}>
                            <CardContent className="space-y-5 pt-8 px-8">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">이메일</Label>
                                    <Input
                                        id="signup-email"
                                        name="email"
                                        type="email"
                                        placeholder="hello@example.com"
                                        className="h-12 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">비밀번호</Label>
                                    <Input
                                        id="signup-password"
                                        name="password"
                                        type="password"
                                        className="h-12 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">비밀번호 확인</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        className="h-12 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white rounded-xl"
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="p-8 pt-4">
                                <Button className="w-full h-14 text-base font-black rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg transition-all active:scale-95" type="submit" disabled={isLoading}>
                                    {isLoading ? '가입 중...' : '회원가입'}
                                </Button>
                            </CardFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </Card>

            <p className="mt-12 text-[10px] font-bold text-slate-600 text-center uppercase tracking-[0.2em] z-10">
                © 2026 더더 간단한 가계부. All rights reserved.
            </p>
        </div>
    )
}
