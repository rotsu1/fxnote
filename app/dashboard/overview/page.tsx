"use client"

import { useState, useEffect } from "react"

import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
import { DashboardSettings } from "@/components/business/overview/dashboard-settings"
import { PLSummaryCards } from "@/components/business/overview/pl-summary-cards"
import { PerformanceMetrics } from "@/components/business/overview/performance-metrics"
import { RecentActivity } from "@/components/business/overview/recent-activity"

export default function Overview() {
  const [settingsVersion, setSettingsVersion] = useState<number>(0);

  const handleSettingsChange = () => {
    // Force immediate refresh of performance metrics
    setSettingsVersion(prev => prev + 1);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">ダッシュボード</h1>
            <DashboardSettings onSettingsChange={handleSettingsChange} />
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 md:px-6 pt-6">
          {/* P/L Summary Cards */}
          <section>
            <h2 className="text-xl font-semibold mb-4">損益サマリーカード</h2>
            <PLSummaryCards />
          </section>

          {/* Performance Metrics */}
          <section>
            <PerformanceMetrics settingsVersion={settingsVersion} />
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-xl font-semibold mb-4">最近の活動</h2>
            <RecentActivity />
          </section>

        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
