"use client"
import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  Settings,
  TrendingUp,
  TrendingDown,
  Plus,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Menu items with Japanese labels
const menuItems = [
  {
    title: "ダッシュボード",
    icon: Home,
    url: "#",
    isActive: true,
  },
  {
    title: "カレンダー",
    icon: Calendar,
    url: "#",
  },
  {
    title: "メモ",
    icon: FileText,
    url: "#",
  },
  {
    title: "分析",
    icon: BarChart3,
    url: "#",
  },
  {
    title: "設定",
    icon: Settings,
    url: "#",
  },
]

// Sample data
const plSummary = [
  { title: "今日の損益", value: "+¥12,500", trend: "up", color: "text-green-600" },
  { title: "今週の損益", value: "+¥45,200", trend: "up", color: "text-green-600" },
  { title: "今月の損益", value: "+¥128,750", trend: "up", color: "text-green-600" },
  { title: "総損益", value: "+¥892,340", trend: "up", color: "text-green-600" },
]

const performanceMetrics = [
  { title: "今月の勝率", value: "68%", description: "32勝 / 47取引" },
  { title: "平均利益/損失", value: "¥2,740", description: "利益時平均" },
  { title: "最大連勝・連敗", value: "7勝 / 3敗", description: "現在の記録" },
  { title: "今月の取引回数", value: "47回", description: "前月比 +12%" },
]

const recentTrades = [
  { date: "2024-01-15", pair: "USD/JPY", type: "買い", pnl: "+¥3,200", status: "利確" },
  { date: "2024-01-15", pair: "EUR/USD", type: "売り", pnl: "-¥1,800", status: "損切" },
  { date: "2024-01-14", pair: "GBP/JPY", type: "買い", pnl: "+¥5,400", status: "利確" },
  { date: "2024-01-14", pair: "USD/JPY", type: "売り", pnl: "+¥2,100", status: "利確" },
  { date: "2024-01-13", pair: "AUD/USD", type: "買い", pnl: "-¥2,900", status: "損切" },
]

const recentNotes = [
  { date: "2024-01-15", title: "市場分析：USD/JPY上昇トレンド", preview: "米国経済指標の好調により..." },
  { date: "2024-01-14", title: "取引戦略の見直し", preview: "リスク管理の改善点について..." },
  { date: "2024-01-13", title: "週間振り返り", preview: "今週の取引結果と反省点..." },
]

function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Trade Tracker</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function PLSummaryCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {plSummary.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PerformanceMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>パフォーマンス指標</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{metric.title}</div>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="text-xs text-muted-foreground">{metric.description}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>クイックアクション</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            新規取引登録
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            <FileText className="mr-2 h-4 w-4" />
            新規メモ作成
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivity() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>最近の取引履歴</CardTitle>
          <CardDescription>最新5件の取引</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">日付</TableHead>
                  <TableHead className="min-w-[80px]">通貨ペア</TableHead>
                  <TableHead className="min-w-[80px]">損益</TableHead>
                  <TableHead className="min-w-[60px]">状態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrades.map((trade, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-sm">{trade.date}</TableCell>
                    <TableCell className="font-medium">{trade.pair}</TableCell>
                    <TableCell className={trade.pnl.startsWith("+") ? "text-green-600" : "text-red-600"}>
                      {trade.pnl}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.status === "利確" ? "default" : "destructive"}>{trade.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近のメモ</CardTitle>
          <CardDescription>最新3件のメモ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentNotes.map((note, index) => (
              <div key={index} className="border-b pb-3 last:border-b-0">
                <div className="font-medium text-sm">{note.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{note.date}</div>
                <div className="text-sm text-muted-foreground mt-1">{note.preview}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MiniCalendar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ミニカレンダー</CardTitle>
        <CardDescription>今月の損益カレンダー</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
            <div key={day} className="p-2 font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <div
              key={day}
              className={`p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                day === 15 ? "bg-green-100 text-green-800" : day === 12 ? "bg-red-100 text-red-800" : ""
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PLTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>損益トレンドチャート</CardTitle>
        <CardDescription>過去30日間の累積損益</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-end justify-between gap-1">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              style={{
                height: `${Math.random() * 100 + 20}px`,
                width: "100%",
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AlertsNotifications() {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>注意:</strong> 今日の損失が¥5,000を超えました。リスク管理を確認してください。
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>月間目標の進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>目標: ¥200,000</span>
              <span>現在: ¥128,750 (64%)</span>
            </div>
            <Progress value={64} className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TradingDashboard() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">ダッシュボード</h1>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 md:p-6">
          {/* P/L Summary Cards */}
          <section>
            <h2 className="text-xl font-semibold mb-4">損益サマリーカード</h2>
            <PLSummaryCards />
          </section>

          {/* Performance Metrics */}
          <section>
            <PerformanceMetrics />
          </section>

          {/* Quick Actions */}
          <section>
            <QuickActions />
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-xl font-semibold mb-4">最近の活動</h2>
            <RecentActivity />
          </section>

          {/* Mini Calendar and P/L Trend Chart */}
          <section className="grid gap-4 lg:grid-cols-2">
            <MiniCalendar />
            <PLTrendChart />
          </section>

          {/* Alerts & Notifications */}
          <section>
            <h2 className="text-xl font-semibold mb-4">アラート・通知</h2>
            <AlertsNotifications />
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
