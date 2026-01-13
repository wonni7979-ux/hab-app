'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export function BudgetDonutCard() {
    const data = [
        { name: '사용', value: 80 },
        { name: '남음', value: 20 },
    ]
    const COLORS = ['#f43f5e', '#334155'] // Rose and Slate-700

    return (
        <Card className="mx-6 border-none bg-slate-900/40 shadow-xl backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 flex items-center gap-6">
                <div className="relative h-24 w-24 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={40}
                                paddingAngle={0}
                                dataKey="value"
                                stroke="none"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-white leading-none">80%</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">사용</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-[17px] font-bold text-white tracking-tight">
                        남은 예산: 200,000원
                    </h3>
                    <p className="text-xs font-bold text-slate-500">
                        총예산: 1,000,000원
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
