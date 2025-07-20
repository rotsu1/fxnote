"use client"
import { useState, useEffect } from "react"
import {
  Calendar,
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
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  AppSidebar,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

// Sample analytics data
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

function KeyStatsGrid() {
  const user = useAuth();
  const [keyStats, setKeyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    supabase
      .from("user_key_stats")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setKeyStats([]);
        } else {
          setKeyStats(data || []);
        }
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-10">
        エラーが発生しました: {error}
      </div>
    );
  }

  if (keyStats.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        統計データがありません
      </div>
    );
  }

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

function MonthlyBreakdown() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const user = useAuth();

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    // Fetch monthly performance data for the selected year
    supabase
      .from("monthly_performance")
      .select("*")
      .eq("user_id", user.id)
      .eq("year", selectedYear)
      .order("month", { ascending: true })
      .then(({ data, error }) => {
        
        if (error) {
          setError(error.message);
          setMonthlyData([]);
        } else {
          // Process the data to create monthly breakdown with default values for missing months
          const monthlyStats = processMonthlyData(data || []);
          setMonthlyData(monthlyStats);
        }
        setLoading(false);
      });
  }, [user, selectedYear]);

  const processMonthlyData = (performanceData: any[]) => {
    const months = [
      "1月", "2月", "3月", "4月", "5月", "6月",
      "7月", "8月", "9月", "10月", "11月", "12月"
    ];
    
    const monthlyStats = months.map((month, index) => {
      const monthNumber = index + 1;
      
      // Match by Japanese month string (e.g., '1月', '2月')
      let monthData = performanceData.find(data => data.month === month);

      if (!monthData) {
        // Return default values for months without data
        return {
          month,
          trades: 0,
          winRate: 0,
          profit: 0,
          avgPips: 0
        };
      }

      return {
        month,
        trades: monthData.trades || 0,
        winRate: monthData.win_rate || 0,
        profit: monthData.profit || 0,
        avgPips: monthData.avg_pips || 0
      };
    });

    return monthlyStats;
  };

  if (loading) {
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
            {[...Array(12)].map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            月別分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-10">
            エラーが発生しました: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              月別分析
            </CardTitle>
            <CardDescription>月ごとの取引統計</CardDescription>
          </div>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
