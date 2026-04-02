'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Users, Shield, ShieldOff, MailWarning, UserX, UserSearch, AlertCircle, Trash2, KeyRound } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { sendPasswordResetAdmin } from './actions'

type AdminUser = {
    id: string
    email: string
    created_at: string
    banned_until: string | null
    is_admin: boolean
}

export default function AdminUsersManagementPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoadingAction, setIsLoadingAction] = useState<string | null>(null)

    // Fetch Users via safe RPC
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin_users_list'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('admin_get_users')
            if (error) {
                toast.error("사용자 로드 실패: " + error.message)
                return []
            }
            return (data as AdminUser[]) || []
        }
    })

    const filteredUsers = users?.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase())) || []

    const revalidate = () => queryClient.invalidateQueries({ queryKey: ['admin_users_list'] })

    // Action Handlers
    const handleToggleRole = async (userId: string, targetAdminStatus: boolean) => {
        if (!confirm(targetAdminStatus ? '이 사용자에게 관리자 권한을 부여하시겠습니까?' : '관리자 권한을 회수하시겠습니까? (이후 이 페이지 접근 불가)')) return
        setIsLoadingAction(userId)
        
        const { error } = await supabase.rpc('admin_toggle_role', { target_user_id: userId, grant_admin: targetAdminStatus })
        if (error) toast.error('권한 변경 실패: ' + error.message)
        else {
            toast.success('권한이 성공적으로 변경되었습니다.')
            revalidate()
        }
        setIsLoadingAction(null)
    }

    const handleToggleBan = async (userId: string, targetBanStatus: boolean) => {
        if (!confirm(targetBanStatus ? '이 사용자를 시스템에서 영구 밴(Ban) 차단 처리하시겠습니까? 로그인이 즉시 불가능해집니다.' : '차단을 해제하여 접속을 허용하시겠습니까?')) return
        setIsLoadingAction(userId)
        
        const { error } = await supabase.rpc('admin_ban_user', { target_user_id: userId, is_banned: targetBanStatus })
        if (error) toast.error('차단 처리 실패: ' + error.message)
        else {
            toast.success(targetBanStatus ? '사용자가 차단되었습니다.' : '사용자 차단이 해제되었습니다.')
            revalidate()
        }
        setIsLoadingAction(null)
    }

    const handleDelete = async (userId: string) => {
        const confirmText = prompt('이 사용자의 계정과 모든 데이터를 완벽하게 삭제합니다. 복구가 불가능합니다.\n정말 삭제하시겠습니까?\n삭제를 원하시면 "삭제"라고 입력해주세요.')
        if (confirmText !== '삭제') return
        setIsLoadingAction(userId)
        
        const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId })
        if (error) toast.error('삭제 실패: ' + error.message)
        else {
            toast.success('사용자가 시스템에서 영구 삭제되었습니다.')
            revalidate()
        }
        setIsLoadingAction(null)
    }

    const handleResetPassword = async (email: string, userId: string) => {
        if (!confirm(`[${email}] 사용자에게 강제 비밀번호 초기화 메일을 발송하시겠습니까?`)) return
        setIsLoadingAction(userId)
        
        const res = await sendPasswordResetAdmin(email)
        if (res.error) toast.error(res.error)
        else toast.success(res.success)
        
        setIsLoadingAction(null)
    }

    return (
        <div className="p-4 py-6 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-500" />
                        시스템 회원 관리 (User Management)
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        전체 회원을 조회하고 권한 제어, 비밀번호 초기화, 차단(Ban) 등을 수행합니다.
                    </p>
                </div>
                
                <div className="relative">
                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="이메일 검색..." 
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-4 py-4 w-1/3">계정 (이메일)</th>
                                <th className="px-4 py-4 w-1/6">가입일시</th>
                                <th className="px-4 py-4 w-1/6">신분 / 상태</th>
                                <th className="px-4 py-4 text-right">제어 메뉴 (Actions)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                        데이터를 불러오는 중입니다...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                        검색된 회원이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isBanned = user.banned_until !== null && new Date(user.banned_until) > new Date()
                                    const isProcessing = isLoadingAction === user.id

                                    return (
                                        <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-slate-800 break-all">{user.email}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.id}</div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {format(new Date(user.created_at), 'yyyy.MM.dd')}
                                                <div className="text-[10px] text-slate-400 mt-0.5">{format(new Date(user.created_at), 'HH:mm')}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    {user.is_admin ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 text-[10px] font-bold rounded-md">
                                                            <Shield className="w-3 h-3" /> 최고 관리자
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                                                            일반 사용자
                                                        </span>
                                                    )}

                                                    {isBanned && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md">
                                                            <AlertCircle className="w-3 h-3" /> 접속 차단(Ban)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                                    {/* 비밀번호 초기화 */}
                                                    <button 
                                                        onClick={() => handleResetPassword(user.email, user.id)}
                                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                                                    >
                                                        <KeyRound className="w-3.5 h-3.5" /> 초기화 메일
                                                    </button>
                                                    
                                                    {/* 권한 변경 */}
                                                    <button 
                                                        onClick={() => handleToggleRole(user.id, !user.is_admin)}
                                                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${user.is_admin ? 'bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                    >
                                                        {user.is_admin ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                                        {user.is_admin ? '일반 유저로 변경' : '관리자 지정'}
                                                    </button>

                                                    {/* 차단(Ban) */}
                                                    <button 
                                                        onClick={() => handleToggleBan(user.id, !isBanned)}
                                                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${isBanned ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                                    >
                                                        {isBanned ? <MailWarning className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                                        {isBanned ? '차단 해제 (Unban)' : '계속 정지 (Ban)'}
                                                    </button>

                                                    {/* 영구 삭제 */}
                                                    <button 
                                                        onClick={() => handleDelete(user.id)}
                                                        className="px-2.5 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> 삭제
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
