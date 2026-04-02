'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ShieldAlert, AlertTriangle, Info, Terminal, Search, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'

type SystemLog = {
    id: string
    created_at: string
    log_level: 'INFO' | 'WARNING' | 'ERROR' | 'SECURITY'
    source: string
    action: string
    user_id: string | null
    details: any
}

export default function AdminLogsPage() {
    const supabase = createClient()
    const [filterLevel, setFilterLevel] = useState<string>('ALL')
    const [searchTerm, setSearchTerm] = useState('')

    const { data: logs, isLoading } = useQuery({
        queryKey: ['system_logs', filterLevel],
        queryFn: async () => {
            let query = supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(200)
            
            if (filterLevel !== 'ALL') {
                query = query.eq('log_level', filterLevel)
            }
            
            const { data, error } = await query
            if (error) {
                console.error('Failed to fetch logs', error)
                return []
            }
            return data as SystemLog[]
        }
    })

    const filteredLogs = logs?.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.source.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const getLevelBadge = (level: string) => {
        switch(level) {
            case 'ERROR': return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">ERROR</span>
            case 'SECURITY': return <span className="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 text-xs font-bold rounded">SECURITY</span>
            case 'WARNING': return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">WARNING</span>
            default: return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">INFO</span>
        }
    }

    const getLevelIcon = (level: string) => {
        switch(level) {
            case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-500" />
            case 'SECURITY': return <ShieldCheck className="w-4 h-4 text-fuchsia-500" />
            case 'WARNING': return <AlertTriangle className="w-4 h-4 text-orange-500" />
            default: return <Info className="w-4 h-4 text-blue-500" />
        }
    }

    return (
        <div className="p-4 py-6 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Terminal className="w-6 h-6 text-slate-800" />
                        시스템 로그 (System Logs)
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        프론트엔드 크래시 에러 및 관리자 페이지 접근 내역을 실시간으로 캐치합니다.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="로그 제목, 에러 출처 검색..." 
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {['ALL', 'ERROR', 'SECURITY', 'WARNING', 'INFO'].map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => setFilterLevel(lvl)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${filterLevel === lvl ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-4 py-3 w-1/12">레벨</th>
                                <th className="px-4 py-3 w-1/6">발생 시각</th>
                                <th className="px-4 py-3 w-1/6">출처 (Source)</th>
                                <th className="px-4 py-3 w-1/2">액션 / 내용</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">로그를 스캔 중입니다...</td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                        기록된 로그가 없습니다. (시스템이 안정적입니다)
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {getLevelBadge(log.log_level)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                                            {format(new Date(log.created_at), 'MM/dd HH:mm:ss')}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{log.source}</span>
                                            {log.user_id && <div className="text-[10px] text-slate-400 mt-1" title={log.user_id}>User: {log.user_id.substring(0,8)}...</div>}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                {getLevelIcon(log.log_level)}
                                                {log.action}
                                            </div>
                                            {log.details && (
                                                <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 overflow-x-auto max-w-full font-mono whitespace-pre-wrap break-all">
                                                    {log.details.message ? (
                                                        <>
                                                            <span className="text-red-500 font-bold">Message:</span> {log.details.message}<br/>
                                                            {log.details.url && <><span className="text-blue-500 font-bold">URL:</span> {log.details.url}<br/></>}
                                                            {log.details.stack && <><span className="text-slate-400 font-bold">Stack:</span> {log.details.stack.substring(0, 300)}...</>}
                                                        </>
                                                    ) : (
                                                        JSON.stringify(log.details, null, 2)
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
