import type { ReactNode } from 'react'
import DashboardSidebar from '@/components/ui/DashboardSidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      {/* Desktop: offset by sidebar width. Mobile: offset by top bar height */}
      <div className="lg:pl-56 pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  )
}
