'use client'

import { useState } from 'react'
import { useForm, FieldValues } from 'react-hook-form'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCategories, usePaymentMethods } from '@/hooks/useMetaData'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const transactionSchema = z.object({
    type: z.enum(['expense', 'income', 'transfer']),
    amount: z.string().min(1, '금액을 입력해주세요'),
    description: z.string().optional(),
    category_id: z.string().optional(),
    payment_method_id: z.string().min(1, '결제 수단을 선택해주세요'),
    to_payment_method_id: z.string().optional(),
    date: z.date(),
}).refine((data) => {
    if (data.type === 'transfer' && !data.to_payment_method_id) return false
    if (data.type !== 'transfer' && !data.category_id) return false
    if (data.type === 'transfer' && data.payment_method_id === data.to_payment_method_id) return false
    return true
}, {
    message: "출금/입금 계좌를 확인하거나 카테고리를 선택해주세요.",
    path: ["to_payment_method_id"]
})

type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionFormProps {

    onSuccess?: () => void
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
    const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense')
    const { data: categories } = useCategories()
    const { data: paymentMethods } = usePaymentMethods()
    const queryClient = useQueryClient()
    const supabase = createClient()

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: 'expense',
            amount: '',
            description: '',
            category_id: '',
            payment_method_id: '',
            to_payment_method_id: '',
            date: new Date(),
        },
    })

    async function onSubmit(values: TransactionFormValues) {

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('로그인이 필요합니다.')
            return
        }

        const { error } = await supabase.from('transactions').insert({
            user_id: user.id,
            type: type,
            amount: Number(values.amount),
            description: values.description || (type === 'transfer' ? '자산 이동' : ''),
            category_id: type === 'transfer' ? null : values.category_id,
            payment_method_id: values.payment_method_id,
            to_payment_method_id: type === 'transfer' ? values.to_payment_method_id : null,
            date: format(values.date, 'yyyy-MM-dd'),
        })

        if (error) {
            toast.error('저장 중 오류가 발생했습니다: ' + error.message)
        } else {
            toast.success('거래가 저장되었습니다.')
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            form.reset()
            onSuccess?.()
        }
    }

    const filteredCategories = categories?.filter((c) => c.type === type)

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-8">
                <Tabs value={type} onValueChange={(v) => {
                    setType(v as any)
                    form.setValue('type', v as any)
                }} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-white/5">
                        <TabsTrigger value="expense" className="data-[state=active]:bg-primary">지출</TabsTrigger>
                        <TabsTrigger value="income" className="data-[state=active]:bg-emerald-500">수입</TabsTrigger>
                        <TabsTrigger value="transfer" className="data-[state=active]:bg-slate-600">이동</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel className="text-slate-400 font-bold text-xs uppercase tracking-widest">금액</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xl">₩</span>
                                        <Input
                                            placeholder="0"
                                            type="number"
                                            className="bg-slate-800 border-white/5 text-white h-14 pl-10 text-2xl font-black rounded-2xl focus:border-primary/50"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[120px] h-14 bg-slate-800 border-white/5 text-white font-bold rounded-2xl hover:bg-slate-700",
                                                    !field.value && "text-slate-500"
                                                )}
                                            >
                                                {field.value instanceof Date ? (
                                                    format(field.value, "MM/dd")
                                                ) : (
                                                    <span>날짜</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-slate-900 border-white/5" align="end">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                            className="bg-slate-900 text-white"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-slate-400 font-bold text-xs uppercase tracking-widest">품목명 / 메모</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={type === 'transfer' ? "예: 생활비 이체, 저축 등" : "무엇을 위해 지출/수입 하셨나요?"}
                                    className="bg-slate-800 border-white/5 text-white h-12 rounded-xl focus:border-primary/50"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    {type !== 'transfer' ? (
                        <FormField
                            control={form.control}
                            name="category_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-400 font-bold text-xs uppercase tracking-widest">카테고리</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-slate-800 border-white/5 text-white h-12 rounded-xl">
                                                <SelectValue placeholder="카테고리 선택" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-slate-900 border-white/5 text-white">
                                            {(filteredCategories || []).map((cat: any) => (
                                                <SelectItem key={cat.id} value={cat.id} className="focus:bg-slate-800">
                                                    <span className="flex items-center gap-2">
                                                        <span>{cat.icon}</span>
                                                        <span>{cat.name}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <FormField
                            control={form.control}
                            name="payment_method_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-400 font-bold text-xs uppercase tracking-widest">보내는 곳</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-slate-800 border-white/5 text-white h-12 rounded-xl">
                                                <SelectValue placeholder="출금 계좌" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-slate-900 border-white/5 text-white">
                                            {paymentMethods?.map((method) => (
                                                <SelectItem key={method.id} value={method.id} className="focus:bg-slate-800">
                                                    {method.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name={type === 'transfer' ? "to_payment_method_id" : "payment_method_id"}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    {type === 'transfer' ? '받는 곳' : '결제 수단'}
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-slate-800 border-white/5 text-white h-12 rounded-xl">
                                            <SelectValue placeholder={type === 'transfer' ? "입금 계좌" : "결제 수단 선택"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-white/5 text-white">
                                        {paymentMethods?.map((method) => (
                                            <SelectItem key={method.id} value={method.id} className="focus:bg-slate-800">
                                                {method.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                    {type === 'expense' ? '지출 기록하기' : type === 'income' ? '수입 기록하기' : '자산 이동하기'}
                </Button>
            </form>
        </Form>
    )
}
