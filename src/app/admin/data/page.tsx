'use client'

import { FileUp, FileDown, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from "@/components/ui/progress"
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function AdminDataPage() {
    const supabase = createClient()
    const [isExporting, setIsExporting] = useState(false)

    const handleBackup = async () => {
        try {
            setIsExporting(true)
            const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
            if (error) throw error

            if (!data || data.length === 0) {
                alert('추출할 데이터가 없습니다.')
                return
            }

            // Generate CSV
            const headers = Object.keys(data[0]).join(',')
            const rows = data.map(row => 
                Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
            )
            const csvContent = [headers, ...rows].join('\n')
            
            // Add BOM for Excel UTF-8
            const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
            const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' })
            
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `system_transactions_backup_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (err: any) {
            alert('데이터 추출 중 오류 발생: ' + err.message)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <FileUp className="text-blue-500 w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-800">엑셀/CSV 데이터 관리</h2>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    인프라 부하 상태 (현재)
                </h3>
                <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                            <span>대량 업로드 큐 (Queue) 대기열</span>
                            <span className="text-emerald-500">정상 (0건 대기)</span>
                        </div>
                        <Progress value={2} className="h-1.5" />
                    </div>
                    <div className="space-y-1 pt-2">
                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                            <span>백업 다운로드 인프라(DB I/O) 부하</span>
                            <span className="text-blue-500">안정적 (12% 사용중)</span>
                        </div>
                        <Progress value={12} className="h-1.5" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800">최근 CSV 업로드 오류 로그</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top 5</span>
                </div>
                <div className="divide-y divide-slate-100">
                    <div className="p-3 px-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 shrink-0">1시간 전</span>
                            <span className="text-sm font-semibold text-slate-700">user_cf12...</span>
                            <span className="text-xs text-rose-500 font-medium">열매칭 오류 (&quot;금액&quot; 열 누락)</span>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2">상세보기</Button>
                    </div>
                    <div className="p-3 px-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 shrink-0">어제</span>
                            <span className="text-sm font-semibold text-slate-700">user_k88x...</span>
                            <span className="text-xs text-rose-500 font-medium">잘못된 날짜 형식 (YYYY-MM-DD 필요)</span>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2">상세보기</Button>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 mt-8">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-800">사용자 가이드 제공 알림</h4>
                    <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                        자주 발생하는 업로드 오류(&quot;금액&quot; 누락, &quot;날짜&quot; 포맷)에 대해 사용자 설정 화면 업로드 모달에 가이드를 자동으로 노출하고 있습니다.
                    </p>
                </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4 flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-700">시스템 전체 백업 추출</span>
                    <span className="text-xs text-slate-500">데이터베이스 덤프(CSV)를 다운로드합니다.</span>
                </div>
                <Button 
                    onClick={handleBackup} 
                    disabled={isExporting} 
                    className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs gap-2"
                >
                    <FileDown size={14} /> {isExporting ? '추출 중...' : 'DB 백업 (CSV)'}
                </Button>
            </div>
        </div>
    )
}
