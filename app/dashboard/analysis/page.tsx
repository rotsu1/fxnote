"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
import { KeyStatsGrid } from "@/components/business/analysis/key-stats-grid";
import { TimeAnalysis } from "@/components/business/analysis/time-analysis";
import { MonthlyBreakdown } from "@/components/business/analysis/monthly-breakdown";

export default function Analysis() {
  const [selectedYear, setSelectedYear] = useState<number | "指定しない">(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | "指定しない">(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | "指定しない">(new Date().getDate());

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  
  // Generate month options
  const monthOptions = [
    { value: 1, label: "1月" },
    { value: 2, label: "2月" },
    { value: 3, label: "3月" },
    { value: 4, label: "4月" },
    { value: 5, label: "5月" },
    { value: 6, label: "6月" },
    { value: 7, label: "7月" },
    { value: 8, label: "8月" },
    { value: 9, label: "9月" },
    { value: 10, label: "10月" },
    { value: 11, label: "11月" },
    { value: 12, label: "12月" },
  ];

  // Generate day options (1-31)
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">分析</h1>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 md:px-6 pt-6">
          {/* Key Statistics */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">主要統計</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">期間:</span>
                <Select value={selectedYear === "指定しない" ? "指定しない" : selectedYear.toString()} onValueChange={(value) => setSelectedYear(value === "指定しない" ? "指定しない" : Number(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="年を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="指定しない">指定しない</SelectItem>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMonth === "指定しない" ? "指定しない" : selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(value === "指定しない" ? "指定しない" : Number(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="月を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="指定しない">指定しない</SelectItem>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDay === "指定しない" ? "指定しない" : selectedDay.toString()} onValueChange={(value) => setSelectedDay(value === "指定しない" ? "指定しない" : Number(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="日を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="指定しない">指定しない</SelectItem>
                    {dayOptions.map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}日
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <KeyStatsGrid 
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                selectedDay={selectedDay}
              />
            </div>
          </section>

          {/* Analysis Tabs */}
          <section>
            <Tabs defaultValue="time" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-2">
                <TabsTrigger value="time">時間帯分析</TabsTrigger>
                <TabsTrigger value="trend">月別分析</TabsTrigger>
              </TabsList>

              <TabsContent value="time" className="mt-6">
                <TimeAnalysis />
              </TabsContent>

              <TabsContent value="trend" className="mt-6">
              <MonthlyBreakdown />
              </TabsContent>
            </Tabs>
          </section>

        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
