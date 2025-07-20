"use client"

import { useState, useEffect } from "react"
import {
  FileText,
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
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  AppSidebar,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"


function PLSummaryCards() {
  const [plSummary, setPlSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const user = useAuth();

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    supabase
      .from("user_pl_summary")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setPlSummary(null);
        } else {
          setPlSummary(data);
        }
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
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

  if (!plSummary) {
    return (
      <div className="text-center text-muted-foreground py-10">
        損益データがありません
      </div>
    );
  }

  const summaryData = [
    { 
      title: "今日の損益", 
      value: `¥${plSummary.daily_profit.toLocaleString()}`, 
      trend: plSummary.daily_profit >= 0 ? "up" : "down", 
      color: plSummary.daily_profit >= 0 ? "text-green-600" : "text-red-600" 
    },
    { 
      title: "今週の損益", 
      value: `¥${plSummary.weekly_profit.toLocaleString()}`, 
      trend: plSummary.weekly_profit >= 0 ? "up" : "down", 
      color: plSummary.weekly_profit >= 0 ? "text-green-600" : "text-red-600" 
    },
    { 
      title: "今月の損益", 
      value: `¥${plSummary.monthly_profit.toLocaleString()}`, 
      trend: plSummary.monthly_profit >= 0 ? "up" : "down", 
      color: plSummary.monthly_profit >= 0 ? "text-green-600" : "text-red-600" 
    },
    { 
      title: "総損益", 
      value: `¥${plSummary.total_profit.toLocaleString()}`, 
      trend: plSummary.total_profit >= 0 ? "up" : "down", 
      color: plSummary.total_profit >= 0 ? "text-green-600" : "text-red-600" 
    },
  ];

  return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item, index) => (
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
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const user = useAuth();

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    supabase
      .from("user_performance_metrics")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setPerformanceData(null);
        } else {
          setPerformanceData(data);
        }
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>パフォーマンス指標</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
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
          <CardTitle>パフォーマンス指標</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-10">
            エラーが発生しました: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>パフォーマンス指標</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">
            パフォーマンスデータがありません
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle old table structure (key-value format)
  const performanceMetrics = [
    { 
      title: "今月の勝率", 
      value: performanceData.monthly_win_rate ? `${performanceData.monthly_win_rate}%` : "N/A", 
      description: performanceData.monthly_win_count && performanceData.monthly_trade_count 
        ? `${performanceData.monthly_win_count}勝 / ${performanceData.monthly_trade_count}取引` 
        : "データなし" 
    },
    { 
      title: "平均利益/損失", 
      value: performanceData.average_profit_loss ? `¥${performanceData.average_profit_loss.toLocaleString()}` : "N/A", 
      description: "利益時平均" 
    },
    { 
      title: "最大連勝・連敗", 
      value: performanceData.max_win_streak && performanceData.max_loss_streak 
        ? `${performanceData.max_win_streak}勝 / ${performanceData.max_loss_streak}敗` 
        : "N/A", 
      description: "現在の記録" 
    },
    { 
      title: "今月の取引回数", 
      value: performanceData.monthly_trade_count ? `${performanceData.monthly_trade_count}回` : "N/A", 
      description: performanceData.previous_month_trade_count 
        ? `前月比 ${performanceData.monthly_trade_count > performanceData.previous_month_trade_count ? '+' : ''}${((performanceData.monthly_trade_count - performanceData.previous_month_trade_count) / performanceData.previous_month_trade_count * 100).toFixed(0)}%` 
        : "データなし" 
    },
  ];

  // If no data is available, show a message
  const hasData = performanceMetrics.some(metric => metric.value !== "N/A");
  
  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>パフォーマンス指標</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">
            パフォーマンスデータがありません。データが正しく設定されているか確認してください。
          </div>
        </CardContent>
      </Card>
    );
  }

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

function RecentActivity() {
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const user = useAuth();

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    // Fetch recent trades
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_time", { ascending: false })
      .limit(5)
      .then(({ data: tradesData, error: tradesError }) => {
        if (tradesError) {
          setError(tradesError.message);
          setRecentTrades([]);
        } else {
          setRecentTrades(tradesData || []);
        }
      });

    // Fetch recent notes
    supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("note_date", { ascending: false })
      .limit(3)
      .then(({ data: notesData, error: notesError }) => {
        if (notesError) {
          setError(notesError.message);
          setRecentNotes([]);
        } else {
          setRecentNotes(notesData || []);
        }
        setLoading(false);
      });
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatProfitLoss = (profitLoss: number) => {
    const formatted = profitLoss.toLocaleString();
    return profitLoss >= 0 ? `+¥${formatted}` : `-¥${Math.abs(profitLoss).toLocaleString()}`;
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近の取引履歴</CardTitle>
            <CardDescription>最新5件の取引</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
              ))}
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
              {[...Array(3)].map((_, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近の取引履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-red-600 py-10">
              エラーが発生しました: {error}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近のメモ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-red-600 py-10">
              エラーが発生しました: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      取引データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTrades.map((trade, index) => (
                    <TableRow key={trade.id || index}>
                      <TableCell className="text-sm">{formatDate(trade.entry_time)}</TableCell>
                      <TableCell className="font-medium">{trade.currency_pair}</TableCell>
                      <TableCell className={trade.profit_loss >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatProfitLoss(trade.profit_loss)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
            {recentNotes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                メモデータがありません
              </div>
            ) : (
              recentNotes.map((note, index) => (
                <div key={note.id || index} className="border-b pb-3 last:border-b-0">
                  <div className="font-medium text-sm">{note.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(note.note_date)}</div>
                  <div className="text-sm text-muted-foreground mt-1">{truncateContent(note.content)}</div>
                </div>
              ))
            )}
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
