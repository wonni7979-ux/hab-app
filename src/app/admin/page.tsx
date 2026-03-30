'use client'

import Link from 'next/link'
import { Server, Users, Tags, CreditCard, ShieldAlert } from 'lucide-react'

export default function AdminPage() {
    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-slate-100/50 rounded-2xl border border-slate-100 mb-6">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                    <Server className="w-6 h-6 text-slate-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">운영자 센터</h2>
                <p className="text-xs text-slate-500 mt-1">시스템 무결성 및 사용자 데이터 관리</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-emerald-500" />
                        시스템 관리
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/admin/categories" className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 hover:bg-slate-50 transition-colors">
                            <Tags className="w-6 h-6 mb-2 text-blue-500" />
                            <span className="text-xs font-semibold text-slate-700">표준 카테고리</span>
                        </Link>
                        <Link href="/admin/payments" className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 hover:bg-slate-50 transition-colors">
                            <CreditCard className="w-6 h-6 mb-2 text-violet-500" />
                            <span className="text-xs font-semibold text-slate-700">결제 수단</span>
                        </Link>
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Users className="w-4 h-4 text-rose-500" />
                        사용자 데이터 관리
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <Link href="/admin/users" className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">사용자 목록 및 자산 통계</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">휴면 계정 관리 및 오류 수정 지원</div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
