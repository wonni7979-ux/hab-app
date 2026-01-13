'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { Settings2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Totals {
    expense: number
    income: number
}

export function SummaryCard() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const thisMonth = format(new Date(), 'yyyy-MM')

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [tempBudget, setTempBudget] = useState('500000')

    const { data: budget } = useQuery({
        queryKey: ['budget', thisMonth],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('budgets')
                .select('*')
                .eq('year_month', thisMonth)
                .single()
            if (error && error.code !== 'PGRST116') throw error
            return data || { total_budget: 500000 }
        },
    })

    useEffect(() => {
        if (budget) {
            setTempBudget(budget.total_budget.toString())
        }
    }, [budget])

    const updateBudgetMutation = useMutation({
        mutationFn: async (newBudget: number) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Unauthorized')

            const { error } = await supabase
                .from('budgets')
                .upsert({
                    user_id: user.id,
                    year_month: thisMonth,
                    total_budget: newBudget
                }, { onConflict: 'user_id, year_month' })

            if (error) throw error
        },
        onSuccess: () => {
            toast.success('예산이 저장되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['budget', thisMonth] })
            setIsDialogOpen(false)
        },
        onError: (error: any) => {
            toast.error('예산 저장 실패: ' + error.message)
        }
    })

    const { data: totals } = useQuery<Totals>({

        queryKey: ['totals', thisMonth],
        queryFn: async () => {
            const startDate = `${thisMonth}-01`
            const endDate = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')

            const { data, error } = await supabase
                .from('transactions')
                .select('type, amount')
                .gte('date', startDate)
                .lte('date', endDate)

            if (error) throw error

            return (data as TransactionSummary[]).reduce((acc: Totals, t: TransactionSummary) => {
                if (t.type === 'expense') acc.expense += t.amount
                else acc.income += t.amount
                return acc
            }, { expense: 0, income: 0 })
        },
    })

    const spendPercent = budget ? (totals?.expense || 0) / budget.total_budget * 100 : 0
    const remaining = (budget?.total_budget || 0) - (totals?.expense || 0)

    return (
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
                </svg>
            </div>

            <div className="absolute top-2 right-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-primary-foreground/50 hover:text-white hover:bg-white/10">
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>이번 달 예산 설정</DialogTitle>
                            <DialogDescription>
                                {thisMonth}의 목표 지출 예산을 입력해 주세요.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="budget" className="text-right">
                                    금액
                                </Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    value={tempBudget}
                                    onChange={(e) => setTempBudget(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
                            <Button onClick={() => updateBudgetMutation.mutate(Number(tempBudget))}>저장하기</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <CardContent className="p-6 space-y-4">
                <div>
                    <p className="text-sm font-medium opacity-80 mb-1">이번 달 남은 예산</p>
                    <h2 className="text-3xl font-extrabold tracking-tight">
                        ₩ {remaining.toLocaleString()}
                    </h2>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span>사용 금액</span>
                        <span>{spendPercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={spendPercent} className="h-2 bg-white/20" />
                </div>

                <div className="flex justify-between items-end pt-2">
                    <div>
                        <p className="text-[10px] opacity-70 uppercase font-black">목표 예산</p>
                        <p className="text-sm font-bold">₩ {budget?.total_budget?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] opacity-70 uppercase font-black">실제 지출</p>
                        <p className="text-sm font-bold">₩ {totals?.expense?.toLocaleString()}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
