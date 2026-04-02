'use client'

import { useEffect } from 'react'
import { logSystemEvent } from '@/app/actions/logActions'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to our DB
        logSystemEvent('ERROR', 'frontend', '일반 사용자 컴포넌트 크래시 (Error Boundary)', {
            message: error.message,
            stack: error.stack,
            digest: error.digest,
            url: window.location.href,
        })
    }, [error])

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-sm w-full text-center space-y-4">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">죄송합니다.<br/>시스템에 일시적인 오류가 발생했습니다.</h2>
                <p className="text-sm text-slate-500 text-left bg-slate-50 p-3 rounded-xl overflow-x-auto text-xs break-all">
                    {error.message}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                    오류 내용이 관리자에게 자동으로 전송되었습니다. 신속하게 해결하겠습니다.
                </p>
                <div className="pt-2">
                    <button
                        onClick={() => reset()}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                    >
                        다시 시도하기
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors mt-2"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    )
}
