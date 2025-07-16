"use client"
import { useState } from "react"
import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  Settings,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Activity,
  PieChart,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

// Menu items
const menuItems = [
  { title: "ダッシュボード", icon: Home, url: "/", isActive: false },
  { title: "カレンダー", icon: Calendar, url: "/calendar", isActive: false },
  { title: "メモ", icon: FileText, url: "#", isActive: false },
  { title: "分析", icon: BarChart3, url: "/analysis", isActive: true },
  { title: "設定", icon: Settings, url: "#", isActive: false },
]

// Sample analytics data
const keyStats = [
  { title: "勝ちトレード平均pips", value: "24.5", unit: "pips", color: "text-green-600" },
  { title: "負けトレード平均pips", value: "-18.2", unit: "pips", color: "text-red-600" },
  { title: "勝ちトレード平均収益", value: "¥4,250", unit: "", color: "text-green-600" },
  { title: "負けトレード平均損失", value: "¥2,890", unit: "", color: "text-red-600" },
  { title: "1日の平均勝ちトレード回数", value: "3.2", unit: "回", color: "text-blue-600" },
  { title: "1日の平均負けトレード回数", value: "1.8", unit: "回", color: "text-orange-600" },
  { title: "ペイオフレシオ", value: "1.47", unit: "", color: "text-purple-600" },
  { title: "勝率", value: "64%", unit: "", color: "text-green-600" },
  { title: "平均保有時間", value: "2h 15m", unit: "", color: "text-blue-600" },
]

const timeAnalysisData = [
  { time: "00:00-02:00", wins: 2, losses: 3, avgPips: -5.2, performance: "weak" },
  { time: "02:00-04:00", wins: 1, losses: 1, avgPips: 2.1, performance: "neutral" },
  { time: "04:00-06:00", wins: 4, losses: 1, avgPips: 18.5, performance: "strong" },
  { time: "06:00-08:00", wins: 8, losses: 2, avgPips: 32.1, performance: "strong" },
  { time: "08:00-10:00", wins: 12, losses: 4, avgPips: 28.7, performance: "strong" },
  { time: "10:00-12:00", wins: 6, losses: 5, avgPips: 8.3, performance: "neutral" },
  { time: "12:00-14:00", wins: 3, losses: 6, avgPips: -12.4, performance: "weak" },
  { time: "14:00-16:00", wins: 9, losses: 3, avgPips: 25.6, performance: "strong" },
  { time: "16:00-18:00", wins: 7, losses: 4, avgPips: 15.2, performance: "neutral" },
  { time: "18:00-20:00", wins: 5, losses: 7, avgPips: -8.9, performance: "weak" },
  { time: "20:00-22:00", wins: 4, losses: 2, avgPips: 12.3, performance: "neutral" },
  { time: "22:00-00:00", wins: 2, losses: 4, avgPips: -15.6, performance: "weak" },
]

const monthlyData = [
  { month: "1月", trades: 47, winRate: 68, profit: 128750, avgPips: 15.2 },
  { month: "2月", trades: 52, winRate: 62, profit: 95420, avgPips: 12.8 },
  { month: "3月", trades: 38, winRate: 71, profit: 156890, avgPips: 18.9 },
  { month: "4月", trades: 44, winRate: 59, profit: 78340, avgPips: 9.4 },
  { month: "5月", trades: 49, winRate: 65, profit: 112560, avgPips: 14.7 },
  { month: "6月", trades: 41, winRate: 73, profit: 189230, avgPips: 21.3 },
]

const marketConditions = [
  { condition: "トレンド相場", trades: 89, winRate: 72, avgProfit: 4850, performance: "excellent" },
  { condition: "レンジ相場", trades: 156, winRate: 58, avgProfit: 2340, performance: "good" },
  { condition: "ボラティリティ高", trades: 67, winRate: 45, avgProfit: 1890, performance: "poor" },
  { condition: "ボラティリティ低", trades: 43, winRate: 69, avgProfit: 3210, performance: "good" },
]

function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg">Trade Tracker</span>
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

function KeyStatsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {keyStats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
              {stat.unit && <span className="text-sm font-normal ml-1">{stat.unit}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MaxDrawdownCard() {
  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-600" />
          最大ドローダウン
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Pips</div>
            <div className="text-2xl font-bold text-red-600">-156.8 pips</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">損失額</div>
            <div className="text-2xl font-bold text-red-600">¥-45,230</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">パーセンテージ</div>
            <div className="text-2xl font-bold text-red-600">-12.4%</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">期間: 2024年4月15日 - 2024年4月22日</div>
          <Progress value={12.4} className="w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function RiskRewardAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          リスクリワード比分析
        </CardTitle>
        <CardDescription>リスクとリワードの関係性を分析</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">平均リスク</div>
              <div className="text-xl font-bold text-red-600">18.2 pips</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">平均リワード</div>
              <div className="text-xl font-bold text-green-600">24.5 pips</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-muted-foreground">リスクリワード比</div>
            <div className="text-2xl font-bold text-blue-600">1:1.35</div>
          </div>

          {/* Simple Risk-Reward Chart */}
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">リスクリワード分布</div>
            <div className="space-y-2">
              {[
                { ratio: "1:3以上", count: 12, percentage: 15 },
                { ratio: "1:2-3", count: 28, percentage: 35 },
                { ratio: "1:1-2", count: 32, percentage: 40 },
                { ratio: "1:1未満", count: 8, percentage: 10 },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-16 text-sm">{item.ratio}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                      </div>
                      <div className="text-sm text-muted-foreground w-12">{item.count}件</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TimeAnalysis() {
  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "strong":
        return "bg-green-500"
      case "weak":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  const getPerformanceText = (performance: string) => {
    switch (performance) {
      case "strong":
        return "得意"
      case "weak":
        return "苦手"
      default:
        return "普通"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-600" />
          時間帯別成績分析
        </CardTitle>
        <CardDescription>時間帯ごとのパフォーマンス分析</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {timeAnalysisData.map((data, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="w-20 text-sm font-medium">{data.time}</div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm text-green-600">{data.wins}勝</div>
                  <div className="text-sm text-red-600">{data.losses}敗</div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      data.performance === "strong"
                        ? "border-green-500 text-green-700"
                        : data.performance === "weak"
                          ? "border-red-500 text-red-700"
                          : "border-gray-500 text-gray-700"
                    }`}
                  >
                    {getPerformanceText(data.performance)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getPerformanceColor(data.performance)}`}
                      style={{ width: `${Math.min(Math.abs(data.avgPips) * 2, 100)}%` }}
                    />
                  </div>
                  <div className={`text-sm font-medium w-16 ${data.avgPips > 0 ? "text-green-600" : "text-red-600"}`}>
                    {data.avgPips > 0 ? "+" : ""}
                    {data.avgPips} pips
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MarketConditionAnalysis() {
  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "excellent":
        return "text-green-600 bg-green-50"
      case "good":
        return "text-blue-600 bg-blue-50"
      case "poor":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          市場状況別分析
        </CardTitle>
        <CardDescription>市場状況ごとのパフォーマンス</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {marketConditions.map((condition, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getPerformanceColor(condition.performance)}`}>
              <div className="font-medium mb-2">{condition.condition}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>取引数: {condition.trades}件</div>
                <div>勝率: {condition.winRate}%</div>
                <div className="col-span-2">平均利益: ¥{condition.avgProfit.toLocaleString()}</div>
              </div>
              <div className="mt-2">
                <Progress value={condition.winRate} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MonthlyBreakdown() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-600" />
          月別分析
        </CardTitle>
        <CardDescription>月ごとの取引統計</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monthlyData.map((month, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="w-12 font-medium">{month.month}</div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">取引数</div>
                  <div className="font-medium">{month.trades}件</div>
                </div>
                <div>
                  <div className="text-muted-foreground">勝率</div>
                  <div className="font-medium">{month.winRate}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">利益</div>
                  <div className={`font-medium ${month.profit > 0 ? "text-green-600" : "text-red-600"}`}>
                    ¥{month.profit.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">平均pips</div>
                  <div className="font-medium">{month.avgPips} pips</div>
                </div>
              </div>

              <div className="w-20">
                <Progress value={month.winRate} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TrendAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          トレンド分析
        </CardTitle>
        <CardDescription>トレンドフォロー戦略の成績</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-muted-foreground">上昇トレンド</div>
              <div className="text-xl font-bold text-green-600">72%</div>
              <div className="text-sm">勝率</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-muted-foreground">下降トレンド</div>
              <div className="text-xl font-bold text-red-600">68%</div>
              <div className="text-sm">勝率</div>
            </div>
          </div>

          {/* Simple trend chart visualization */}
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">月間トレンド成績</div>
            <div className="h-32 flex items-end justify-between gap-1">
              {[65, 72, 68, 71, 69, 74].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${value}%` }} />
                  <div className="text-xs mt-1">{index + 1}月</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartsDisplay() {
  const [chartType, setChartType] = useState("bar")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-purple-600" />
          いろんなチャート表示
        </CardTitle>
        <CardDescription>
          <div className="flex items-center gap-2">
            <span>データの可視化</span>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">棒グラフ</SelectItem>
                <SelectItem value="line">線グラフ</SelectItem>
                <SelectItem value="pie">円グラフ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartType === "bar" && (
          <div className="h-48 flex items-end justify-between gap-2">
            {[45, 72, 38, 65, 89, 56, 73].map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                  style={{ height: `${value}%` }}
                />
                <div className="text-xs mt-1">Week {index + 1}</div>
              </div>
            ))}
          </div>
        )}

        {chartType === "line" && (
          <div className="h-48 relative">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points="0,150 50,120 100,80 150,100 200,60 250,90 300,40 350,70 400,50"
              />
              {[150, 120, 80, 100, 60, 90, 40, 70, 50].map((y, index) => (
                <circle key={index} cx={index * 50} cy={y} r="3" fill="#3b82f6" />
              ))}
            </svg>
          </div>
        )}

        {chartType === "pie" && (
          <div className="h-48 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full bg-gradient-conic from-green-500 via-blue-500 to-red-500"></div>
              <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm font-medium">勝率</div>
                  <div className="text-lg font-bold">64%</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AnalysisPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">分析</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* Key Statistics */}
          <section>
            <h2 className="text-xl font-semibold mb-4">主要統計</h2>
            <div className="space-y-4">
              <KeyStatsGrid />
              <MaxDrawdownCard />
            </div>
          </section>

          {/* Analysis Tabs */}
          <section>
            <Tabs defaultValue="risk-reward" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="risk-reward">リスク分析</TabsTrigger>
                <TabsTrigger value="time">時間帯分析</TabsTrigger>
                <TabsTrigger value="market">市場状況</TabsTrigger>
                <TabsTrigger value="trend">トレンド</TabsTrigger>
              </TabsList>

              <TabsContent value="risk-reward" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <RiskRewardAnalysis />
                  <ChartsDisplay />
                </div>
              </TabsContent>

              <TabsContent value="time" className="mt-6">
                <TimeAnalysis />
              </TabsContent>

              <TabsContent value="market" className="mt-6">
                <MarketConditionAnalysis />
              </TabsContent>

              <TabsContent value="trend" className="mt-6">
                <TrendAnalysis />
              </TabsContent>
            </Tabs>
          </section>

          {/* Monthly Breakdown */}
          <section>
            <MonthlyBreakdown />
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
