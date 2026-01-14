import { DashboardHeader } from '@/components/home/DashboardHeader'
import { CalendarSection } from '@/components/home/CalendarSection'
import { BudgetDonutCard } from '@/components/home/BudgetDonutCard'
import { AISummaryCard } from '@/components/home/AISummaryCard'
import { FloatingButton } from '@/components/layout/FloatingButton'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      <DashboardHeader />

      <div className="space-y-8 py-2">
        <CalendarSection />
        <BudgetDonutCard />
        <AISummaryCard />
      </div>

      <FloatingButton />
    </div>
  )
}
