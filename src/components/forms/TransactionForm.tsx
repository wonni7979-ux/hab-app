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
    type: z.enum(['expense', 'income']),
    amount: z.string().min(1, '금액을 입력해주세요'),
    description: z.string().optional(),
    category_id: z.string().min(1, '카테고리를 선택해주세요'),
    payment_method_id: z.string().min(1, '결제 수단을 선택해주세요'),
    date: z.date(),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionFormProps {

    onSuccess?: () => void
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
    const [type, setType] = useState<'expense' | 'income'>('expense')
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
            description: values.description,
            category_id: values.category_id,
            payment_method_id: values.payment_method_id,
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
                <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="expense">지출</TabsTrigger>
                        <TabsTrigger value="income">수입</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (

                            <FormItem className="flex-1">
                                <FormLabel>금액</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₩</span>
                                        <Input
                                            placeholder="0"
                                            type="number"
                                            className="pl-8 text-lg font-bold"
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
                                                    "w-[140px] pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value instanceof Date ? (
                                                    format(field.value, "MM/dd")
                                                ) : (
                                                    <span>날짜 선택</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
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
                            <FormLabel>품목명</FormLabel>
                            <FormControl>
                                <Input placeholder="무엇을 위해 지출/수입 하셨나요?" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (

                            <FormItem>
                                <FormLabel>카테고리</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="선택" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(filteredCategories || []).map((cat: { id: string, name: string }) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payment_method_id"
                        render={({ field }) => (

                            <FormItem>
                                <FormLabel>결제 수단</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="선택" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {paymentMethods?.map((method) => (
                                            <SelectItem key={method.id} value={method.id}>
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

                <Button type="submit" className="w-full h-12 text-base font-bold">저장하기</Button>
            </form>
        </Form>
    )
}
