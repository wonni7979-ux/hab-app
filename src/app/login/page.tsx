'use client'

import { useState } from 'react'
import { login, signup, forgotPassword } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { PiggyBank } from 'lucide-react'

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('login')
    const supabase = createClient()

    async function handleGoogleLogin() {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=/`
            }
        })
        if (error) {
            toast.error(error.message)
            setIsLoading(false)
        }
    }

    async function handleSubmit(formData: FormData, mode: 'login' | 'signup' | 'forgot') {
        setIsLoading(true)
        
        let result;
        if (mode === 'login') result = await login(formData)
        else if (mode === 'signup') result = await signup(formData)
        else if (mode === 'forgot') result = await forgotPassword(formData)

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
                    <h1 className="text-3xl font-black tracking-tight text-white">모두의 가계부</h1>
                    <p className="text-slate-400 font-medium text-sm">나의 소중한 자산 관리, 지금 시작하세요.</p>
                </div>
            </div>

            <Card className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl z-10 overflow-hidden rounded-3xl">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <CardHeader className="p-1">
                        <TabsList className={`grid w-full rounded-2xl bg-slate-800/30 h-14 p-1 ${activeTab === 'forgot' ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
                            {activeTab === 'forgot' && (
                                <TabsTrigger
                                    value="forgot"
                                    className="rounded-xl text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                                >
                                    비번 찾기
                                </TabsTrigger>
                            )}
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
                                    {isLoading ? '로그인 중...' : '이메일로 로그인'}
                                </Button>

                                <div className="relative mt-2 mb-2 w-full">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-700/50"></span>
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                                        <span className="px-2 text-slate-500 bg-[#0f172a]">OR</span>
                                    </div>
                                </div>

                                <Button 
                                    type="button" 
                                    onClick={handleGoogleLogin} 
                                    disabled={isLoading}
                                    className="w-full h-14 text-base font-bold rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border-0 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all active:scale-95"
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google 계정으로 계속하기
                                </Button>

                                <Button variant="link" className="mt-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors" type="button" onClick={() => setActiveTab('forgot')}>
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
                            <CardFooter className="flex flex-col p-8 pt-4">
                                <Button className="w-full h-14 text-base font-black rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg transition-all active:scale-95" type="submit" disabled={isLoading}>
                                    {isLoading ? '가입 중...' : '이메일로 회원가입'}
                                </Button>

                                <div className="relative mt-4 mb-4 w-full">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-700/50"></span>
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                                        <span className="px-2 text-slate-500 bg-[#0f172a]">OR</span>
                                    </div>
                                </div>

                                <Button 
                                    type="button" 
                                    onClick={handleGoogleLogin} 
                                    disabled={isLoading}
                                    className="w-full h-14 text-base font-bold rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border-0 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all active:scale-95"
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google 계정으로 가입하기
                                </Button>
                            </CardFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="forgot" className="mt-0">
                        <form action={(fd) => handleSubmit(fd, 'forgot')}>
                            <CardContent className="space-y-5 pt-8 px-8">
                                <div className="space-y-2">
                                    <Label htmlFor="forgot-email" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">가입한 이메일 입력</Label>
                                    <Input
                                        id="forgot-email"
                                        name="email"
                                        type="email"
                                        placeholder="hello@example.com"
                                        className="h-12 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white rounded-xl"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-slate-400 px-1 leading-relaxed">
                                    등록하신 이메일을 입력하시면 비밀번호를 다시 설정할 수 있는 보안 링크를 보내드립니다.
                                </p>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4 p-8 pt-4">
                                <Button className="w-full h-14 text-base font-black rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg transition-all active:scale-95" type="submit" disabled={isLoading}>
                                    {isLoading ? '전송 중...' : '복구 링크 보내기'}
                                </Button>
                                <Button onClick={() => setActiveTab('login')} variant="link" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors" type="button">
                                    다시 로그인 페이지로 돌아가기
                                </Button>
                            </CardFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </Card>

            <p className="mt-12 text-[10px] font-bold text-slate-600 text-center uppercase tracking-[0.2em] z-10">
                © 2026 모두의 가계부. All rights reserved.
            </p>
        </div>
    )
}
