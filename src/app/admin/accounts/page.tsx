'use client'

import { useState } from 'react'
import { searchAdminUsers, sendPasswordResetEmailAction, forceUpdateUserPassword } from '@/app/actions/admin-users'
import { KeyRound, Search, AlertOctagon, MailCheck, ShieldAlert, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface UserRecord {
    id: string
    email: string
    created_at: string
    last_sign_in_at: string | null
}

export default function AdminAccountsPage() {
    const [query, setQuery] = useState('')
    const [users, setUsers] = useState<UserRecord[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)

    // Manual Reset State
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [tempPassword, setTempPassword] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        
        setIsLoading(true)
        setAuthError(null)
        setUsers([])
        setSelectedUser(null)
        
        const res = await searchAdminUsers(query)
        
        if (!res.success) {
            setAuthError(res.error)
        } else {
            setUsers(res.users || [])
        }
        setIsLoading(false)
    }

    const handleSendLink = async (email: string) => {
        const confirm = window.confirm(`[${email}] 님에게 비밀번호 재설정 링크를 발송하시겠습니까?\n\n* 실제 운영 시 서버 연동에 따라 이메일이 바로 전송될 수 있습니다.`)
        if (!confirm) return

        setIsUpdating(true)
        const toastId = toast.loading('링크 발송 중...')
        
        const res = await sendPasswordResetEmailAction(email)
        if (res.success) {
            toast.success('복구 링크용 토큰이 성공적으로 발행되었습니다!', { id: toastId })
            console.log("복구 링크(개발자 확인용):", res.link) // Very useful for admin copying
            alert(`복구 링크가 발행되었습니다.\n(개발자 F12 콘솔에서도 확인 가능)\n\n생성된 링크:\n${res.link}`)
        } else {
            toast.error(`발송 실패: ${res.error}`, { id: toastId })
        }
        setIsUpdating(false)
    }

    const handleForcePassword = async (userId: string) => {
        if (tempPassword.length < 6) {
            toast.error('비밀번호는 최소 6자리 이상이어야 합니다.')
            return
        }
        
        const confirm = window.confirm(`해당 계정의 비밀번호를 [${tempPassword}] 로 즉시 강제 변경하시겠습니까?`)
        if (!confirm) return

        setIsUpdating(true)
        const toastId = toast.loading('강제 변경 중...')
        
        const res = await forceUpdateUserPassword(userId, tempPassword)
        if (res.success) {
            toast.success(`[${res.email}] 계정의 임시 비밀번호가 설정되었습니다!`, { id: toastId })
            setTempPassword('')
            setSelectedUser(null)
        } else {
            toast.error(`변경 실패: ${res.error}`, { id: toastId })
        }
        setIsUpdating(false)
    }

    return (
        <div className="p-4 space-y-6 pb-20">
            <div className="flex items-center gap-2 mb-2">
                <KeyRound className="text-rose-500 w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-800">고객 계정 관리 (ID/PW 복구)</h2>
            </div>

            {/* Error State Banner */}
            {authError && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
                    <AlertOctagon className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-rose-800">서버 권한 오류 (Bypass Blocked)</h4>
                        <p className="text-[11px] text-rose-700/80 mt-1 leading-relaxed">
                            {authError}
                        </p>
                    </div>
                </div>
            )}

            {/* Warning Banner */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-slate-700">개인정보 무단 접근 주의</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        계정 복구를 위해 검색된 고객 이메일 목록은 보안 로그에 기록될 수 있습니다. 고객이 요청한 본인 확인 절차가 완료된 계정에 한해 재설정 링크 발송을 수행하십시오. 기존 비밀번호는 역참조 조회가 불가능합니다.
                    </p>
                </div>
            </div>

            {/* Search Tool */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input 
                        placeholder="고객 이메일 아이디 또는 빈칸 검색" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 h-12 bg-white rounded-xl text-sm border-slate-200 focus-visible:ring-rose-500"
                    />
                </div>
                <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="h-12 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold"
                >
                    {isLoading ? '조회 중...' : '계정 조회'}
                </Button>
            </form>

            {/* Results */}
            {users.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">조회된 가입자 목록 ({users.length}명)</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {users.map(user => (
                            <div key={user.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-800">{user.email}</span>
                                        <span className="text-[10px] text-slate-400 mt-1">
                                            가입일: {format(new Date(user.created_at), 'yyyy-MM-dd')}
                                            {user.last_sign_in_at && ` · 최근 접속: ${format(new Date(user.last_sign_in_at), 'yy.MM.dd')}`}
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isUpdating}
                                        onClick={() => handleSendLink(user.email)}
                                        className="h-8 rounded-lg text-[11px] font-bold border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                                    >
                                        <MailCheck size={14} /> 링크 발송
                                    </Button>
                                </div>

                                {/* Force Password Change UI (Expandable) */}
                                {selectedUser === user.id ? (
                                    <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-rose-800 uppercase tracking-widest">임시 비밀번호 강제 설정</label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    type="text" 
                                                    placeholder="임시 비밀번호 최소 6자리" 
                                                    value={tempPassword}
                                                    onChange={e => setTempPassword(e.target.value)}
                                                    className="h-10 text-sm bg-white"
                                                    autoComplete="off"
                                                />
                                                <Button 
                                                    onClick={() => handleForcePassword(user.id)}
                                                    disabled={isUpdating || tempPassword.length < 6}
                                                    className="h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-4"
                                                >
                                                    강제 변경
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    className="h-10 px-2 text-rose-500" 
                                                    onClick={() => setSelectedUser(null)}
                                                >
                                                    취소
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-1">
                                        <button 
                                            onClick={() => { setSelectedUser(user.id); setTempPassword(''); }}
                                            className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                                        >
                                            [위험] 수동으로 임시 비밀번호 덮어쓰기 <ArrowRight size={10} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
