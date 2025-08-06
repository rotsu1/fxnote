"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

interface Metric {
  key: string;
  title: string;
  format: (value: any) => string;
  color: (value: any) => string;
}

interface KeyStatsGridProps {
  selectedYear: number | "指定しない";
  selectedMonth: number | "指定しない";
  selectedDay: number | "指定しない";
}

function KeyStatsGrid({ selectedYear, selectedMonth, selectedDay }: KeyStatsGridProps) {
  const user = useAuth();
  const [keyStats, setKeyStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    // Build query based on selected date filters
    let query = supabase
      .from("user_performance_metrics")
      .select("*")
      .eq("user_id", user.id);
    
    // Determine period type and value based on selected filters
    let periodType = "yearly";
    let periodValue = "";
    
    if (selectedYear !== "指定しない") {
      if (selectedMonth !== "指定しない" && selectedDay !== "指定しない") {
        // All three specified - daily
        periodType = "daily";
        periodValue = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
        query = query.eq("period_type", periodType).eq("period_value", periodValue);
      } else if (selectedMonth !== "指定しない") {
        // Year and month specified - monthly
        periodType = "monthly";
        periodValue = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
        query = query.eq("period_type", periodType).eq("period_value", periodValue);
      } else if (selectedDay !== "指定しない") {
        // Year and day specified, but month is "指定しない" - get all daily records for that day across all months
        periodType = "daily";
        query = query.eq("period_type", periodType)
                    .like("period_value", `${selectedYear}-%-${selectedDay.toString().padStart(2, '0')}`);
      } else {
        // Only year specified - yearly
        periodType = "yearly";
        periodValue = selectedYear.toString();
        query = query.eq("period_type", periodType).eq("period_value", periodValue);
      }
    } else {
      // Handle partial matches when some fields are "指定しない"
      if (selectedMonth !== "指定しない" && selectedDay !== "指定しない") {
        // Month and day specified, but year is "指定しない" - get all daily records for that month-day across all years
        periodType = "daily";
        query = query.eq("period_type", periodType)
                    .like("period_value", `%-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`);
      } else if (selectedMonth !== "指定しない") {
        // Only month specified - get all monthly records for that month across all years
        periodType = "monthly";
        query = query.eq("period_type", periodType)
                    .like("period_value", `%-${selectedMonth.toString().padStart(2, '0')}`);
      } else if (selectedDay !== "指定しない") {
        // Only day specified - get all daily records for that day across all years and months
        periodType = "daily";
        query = query.eq("period_type", periodType)
                    .like("period_value", `%-%-${selectedDay.toString().padStart(2, '0')}`);
      }
    }
    
    query.then(({ data, error }) => {
      if (error) {
        setError(error.message);
        setKeyStats(null);
      } else {
        // Aggregate data if multiple rows returned
        if (data && data.length > 0) {
          const aggregatedStats = aggregateMetrics(data);
          setKeyStats(aggregatedStats);
        } else {
          setKeyStats(null);
        }
      }
      setLoading(false);
    });
  }, [user, selectedYear, selectedMonth, selectedDay]);

  const aggregateMetrics = (data: any[]) => {
    const total = data.reduce((acc, row) => {
      return {
        win_count: (acc.win_count || 0) + (row.win_count || 0),
        loss_count: (acc.loss_count || 0) + (row.loss_count || 0),
        win_profit: (acc.win_profit || 0) + (row.win_profit || 0),
        loss_loss: (acc.loss_loss || 0) + (row.loss_loss || 0),
        win_pips: (acc.win_pips || 0) + (row.win_pips || 0),
        loss_pips: (acc.loss_pips || 0) + (row.loss_pips || 0),
        win_holding_time: (acc.win_holding_time || 0) + (row.win_holding_time || 0),
        loss_holding_time: (acc.loss_holding_time || 0) + (row.loss_holding_time || 0),
      };
    }, {});

    const count = data.length;
    
    // Calculate aggregated metrics
    const win_rate = total.win_count + total.loss_count > 0 
      ? (total.win_count / (total.win_count + total.loss_count)) * 100 
      : 0;
    
    const avg_win_trade_profit = total.win_count > 0 
      ? total.win_profit / total.win_count 
      : 0;
    
    const avg_loss_trade_loss = total.loss_count > 0 
      ? total.loss_loss / total.loss_count 
      : 0;
    
    const avg_win_trade_pips = total.win_count > 0 
      ? total.win_pips / total.win_count 
      : 0;
    
    const avg_loss_trade_pips = total.loss_count > 0 
      ? total.loss_pips / total.loss_count 
      : 0;
    
    const avg_win_holding_time = total.win_count > 0 
      ? total.win_holding_time / total.win_count 
      : 0;
    
    const avg_loss_holding_time = total.loss_count > 0 
      ? total.loss_holding_time / total.loss_count 
      : 0;
    
    const payoff_ratio = total.loss_count > 0 && Math.abs(avg_loss_trade_loss) > 0
      ? avg_win_trade_profit / Math.abs(avg_loss_trade_loss)
      : 0;

    return {
      win_rate,
      avg_win_trade_profit,
      avg_loss_trade_loss,
      avg_win_trade_pips,
      avg_loss_trade_pips,
      avg_win_holding_time,
      avg_loss_holding_time,
      payoff_ratio
    };
  };

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

  if (!keyStats) {
    return (
      <div className="text-center text-muted-foreground py-10">
        統計データがありません
      </div>
    );
  }

  // Define the metrics with their Japanese titles and formatting
  const metrics: Metric[] = [
    { 
      key: 'win_rate', 
      title: '勝率', 
      format: (value: number | string) => typeof value === "number" ? `${value.toFixed(1)}%` : value,
      color: (value: number | string) => typeof value === "number"
        ? value >= 60 ? "text-green-600" : value >= 40 ? "text-yellow-600" : "text-red-600"
        : "text-gray-400"
    },
    { 
      key: 'avg_win_trade_profit', 
      title: '平均利益', 
      format: (value: number | string) => typeof value === "number" ? `${value.toLocaleString()}` : value,
      color: (_value: number | string) => "text-green-600"
    },
    { 
      key: 'avg_loss_trade_loss', 
      title: '平均損失', 
      format: (value: number | string) => typeof value === "number" ? `-${(Math.abs(value)).toLocaleString()}` : value,
      color: (_value: number | string) => "text-red-600"
    },
    { 
      key: 'avg_win_trade_pips', 
      title: '平均利益pips', 
      format: (value: number | string) => typeof value === "number" ? `${value.toFixed(1)} pips` : value,
      color: (_value: number | string) => "text-green-600"
    },
    { 
      key: 'avg_loss_trade_pips', 
      title: '平均損失pips', 
      format: (value: number | string) => typeof value === "number" ? `${value.toFixed(1)} pips` : value,
      color: (_value: number | string) => "text-red-600"
    },
    { 
      key: 'avg_win_holding_time', 
      title: '平均利益保有時間', 
      format: (value: number | string) => {
        if (typeof value === "string") return value;
        if (typeof value === "number" && !isNaN(value) && value > 0) {
          // Convert seconds to days, hours, minutes, and seconds
          const days = Math.floor(value / 86400);
          const hours = Math.floor((value % 86400) / 3600);
          const minutes = Math.floor((value % 3600) / 60);
          const seconds = Math.floor(value % 60);
          
          const parts = [];
          if (days > 0) parts.push(`${days}日`);
          if (hours > 0 || days > 0) parts.push(`${hours}時間`);
          if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}分`);
          parts.push(`${seconds}秒`);
          
          return parts.join(' ');
        }
        return "データなし";
      },
      color: (value: number | string) => {
        if (typeof value === "string" || (typeof value === "number" && (isNaN(value) || value <= 0))) {
          return "text-gray-400";
        }
        return "text-blue-600";
      }
    },
    { 
      key: 'avg_loss_holding_time', 
      title: '平均損失保有時間', 
      format: (value: number | string) => {
        if (typeof value === "string") return value;
        if (typeof value === "number" && !isNaN(value) && value > 0) {
          // Convert seconds to days, hours, minutes, and seconds
          const days = Math.floor(value / 86400);
          const hours = Math.floor((value % 86400) / 3600);
          const minutes = Math.floor((value % 3600) / 60);
          const seconds = Math.floor(value % 60);
          
          const parts = [];
          if (days > 0) parts.push(`${days}日`);
          if (hours > 0 || days > 0) parts.push(`${hours}時間`);
          if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}分`);
          parts.push(`${seconds}秒`);
          
          return parts.join(' ');
        }
        return "データなし";
      },
      color: (value: number | string) => {
        if (typeof value === "string" || (typeof value === "number" && (isNaN(value) || value <= 0))) {
          return "text-gray-400";
        }
        return "text-blue-600";
      }
    },
    { 
      key: 'payoff_ratio', 
      title: 'ペイオフ比率', 
      format: (value: number | string) => {
        if (typeof value === "string") return value;
        if (typeof value === "number" && !isNaN(value) && value > 0) {
          return value.toFixed(2);
        }
        return "データなし";
      },
      color: (value: number | string) => {
        if (typeof value === "string" || (typeof value === "number" && (isNaN(value) || value <= 0))) {
          return "text-gray-400";
        }
        return typeof value === "number"
          ? value >= 1.5 ? "text-green-600" : value >= 1.0 ? "text-yellow-600" : "text-red-600"
          : "text-gray-400";
      }
    },
  ];

  return (
    <div className="space-y-4">
      {/* Key Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metrics.map((metric, index) => {
        const value = keyStats?.[metric.key];
        
        // Show "データなし" if no data or value is 0/null/undefined
        const displayValue = (value === null || value === undefined || value === 0) 
          ? "データなし" 
          : value;
        
        // Determine color class
        let colorClass = "text-gray-900 dark:text-gray-100";
        if (displayValue === "データなし") {
          colorClass = "text-gray-400";
        } else {
          colorClass = metric.color(displayValue);
        }
        
        return (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${colorClass}`}>
                {metric.format(displayValue)}
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  )
}

function TimeAnalysis() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [timeData, setTimeData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const user = useAuth();

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

  useEffect(() => {
    console.log('TimeAnalysis: useEffect triggered with user:', user?.id);
    
    if (!user) {
      console.log('TimeAnalysis: No user, returning early');
      return;
    }
    
    setLoading(true);
    setError("");
    
    // Calculate date range for the selected year and month
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    
    console.log('TimeAnalysis: Fetching trades for period:', {
      selectedYear,
      selectedMonth,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateLocal: startDate.toString(),
      endDateLocal: endDate.toString()
    });
    
    // Fetch all trades for the selected month
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .gte("entry_time", startDate.toISOString())
      .lte("entry_time", endDate.toISOString())
      .then(({ data, error }) => {
        console.log('TimeAnalysis: Supabase response:', { data, error, dataLength: data?.length });
        
        if (data && data.length > 0) {
          console.log('TimeAnalysis: Sample trade structure:', data[0]);
        }
        
        if (error) {
          console.error('TimeAnalysis: Error fetching trades:', error);
          setError(error.message);
          setTimeData([]);
        } else {
          // Define time slots (1-hour intervals)
          const timeSlots = [
            { hour: 0, label: "00:00-01:00" },
            { hour: 1, label: "01:00-02:00" },
            { hour: 2, label: "02:00-03:00" },
            { hour: 3, label: "03:00-04:00" },
            { hour: 4, label: "04:00-05:00" },
            { hour: 5, label: "05:00-06:00" },
            { hour: 6, label: "06:00-07:00" },
            { hour: 7, label: "07:00-08:00" },
            { hour: 8, label: "08:00-09:00" },
            { hour: 9, label: "09:00-10:00" },
            { hour: 10, label: "10:00-11:00" },
            { hour: 11, label: "11:00-12:00" },
            { hour: 12, label: "12:00-13:00" },
            { hour: 13, label: "13:00-14:00" },
            { hour: 14, label: "14:00-15:00" },
            { hour: 15, label: "15:00-16:00" },
            { hour: 16, label: "16:00-17:00" },
            { hour: 17, label: "17:00-18:00" },
            { hour: 18, label: "18:00-19:00" },
            { hour: 19, label: "19:00-20:00" },
            { hour: 20, label: "20:00-21:00" },
            { hour: 21, label: "21:00-22:00" },
            { hour: 22, label: "22:00-23:00" },
            { hour: 23, label: "23:00-00:00" }
          ];
          
          // Process hourly data from trades
          const processedData = timeSlots.map(timeSlot => {
            // Filter trades for this specific hour
            const hourTrades = data?.filter(trade => {
              if (!trade.entry_time) return false;
              
              const entryTime = new Date(trade.entry_time);
              const hour = entryTime.getHours();
              
              return hour === timeSlot.hour;
            }) || [];
            
            if (hourTrades.length > 0) {
              console.log(`TimeAnalysis: Found ${hourTrades.length} trades for hour ${timeSlot.hour}:`, hourTrades);
            }
            
            if (hourTrades.length === 0) {
              return {
                time: timeSlot.label,
                wins: 0,
                losses: 0,
                avgPips: 0,
                performance: "neutral"
              };
            }
            
            // Calculate metrics for this hour
            let wins = 0;
            let losses = 0;
            let totalPips = 0;
            let totalProfit = 0;
            let winProfit = 0;
            let lossLoss = 0;
            let winPips = 0;
            let lossPips = 0;
            let winHoldingTime = 0;
            let lossHoldingTime = 0;
            let winCountWithHoldingTime = 0;
            let lossCountWithHoldingTime = 0;
            let winCountWithPips = 0;
            let lossCountWithPips = 0;
            
            hourTrades.forEach(trade => {
              const profit = trade.profit_loss || 0;
              const pips = trade.pips || 0;
              const holdingTime = trade.hold_time || 0;
              
              totalProfit += profit;
              
              if (profit > 0) {
                wins++;
                winProfit += profit;
                if (pips > 0) {
                  winPips += pips;
                  winCountWithPips++;
                }
                if (holdingTime > 0) {
                  winHoldingTime += holdingTime;
                  winCountWithHoldingTime++;
                }
              } else if (profit < 0) {
                losses++;
                lossLoss += profit; // This will be negative
                if (pips > 0) {
                  lossPips += pips;
                  lossCountWithPips++;
                }
                if (holdingTime > 0) {
                  lossHoldingTime += holdingTime;
                  lossCountWithHoldingTime++;
                }
              }
            });
            
            const totalTrades = wins + losses;
            const avgWinProfit = wins > 0 ? winProfit / wins : 0;
            const avgLossLoss = losses > 0 ? lossLoss / losses : 0;
            const avgWinPips = winCountWithPips > 0 ? winPips / winCountWithPips : 0;
            const avgLossPips = lossCountWithPips > 0 ? lossPips / lossCountWithPips : 0;
            const avgWinHoldingTime = winCountWithHoldingTime > 0 ? winHoldingTime / winCountWithHoldingTime : 0;
            const avgLossHoldingTime = lossCountWithHoldingTime > 0 ? lossHoldingTime / lossCountWithHoldingTime : 0;
            
            return {
              time: timeSlot.label,
              wins: wins,
              losses: losses,
              totalProfit: totalProfit,
              avgWinProfit: avgWinProfit,
              avgLossLoss: avgLossLoss,
              avgWinPips: avgWinPips,
              avgLossPips: avgLossPips,
              avgWinHoldingTime: avgWinHoldingTime,
              avgLossHoldingTime: avgLossHoldingTime
            };
          });
          
          console.log('TimeAnalysis: Processed data:', processedData);
          setTimeData(processedData);
        }
        setLoading(false);
      });
  }, [user, selectedYear, selectedMonth]);

  const formatHoldingTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}日`);
    if (hours > 0 || days > 0) parts.push(`${hours}時間`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}分`);
    parts.push(`${secs}秒`);
    
    return parts.join(' ');
  };

  if (loading) {
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
            {[...Array(12)].map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
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
            <Clock className="h-5 w-5 text-purple-600" />
            時間帯別成績分析
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

  console.log('TimeAnalysis: Rendering with timeData:', timeData);

  if (!timeData || timeData.length === 0) {
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
          <div className="text-center text-muted-foreground py-10">
            指定された期間のデータがありません
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
              <Clock className="h-5 w-5 text-purple-600" />
              時間帯別成績分析
            </CardTitle>
            <CardDescription>時間帯ごとのパフォーマンス分析</CardDescription>
          </div>
          <div className="flex gap-2">
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
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {timeData.map((data, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="w-20 text-sm font-medium">{data.time}</div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm text-green-600">{data.wins || 0}勝</div>
                  <div className="text-sm text-red-600">{data.losses || 0}敗</div>
                  <div className={`text-sm font-medium ${(data.totalProfit || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                    総損益: ¥{(data.totalProfit || 0).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">平均利益</div>
                    <div className="font-medium text-green-600">¥{(data.avgWinProfit || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均損失</div>
                    <div className="font-medium text-red-600">¥{(data.avgLossLoss || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均利益pips</div>
                    <div className="font-medium text-green-600">{(data.avgWinPips || 0).toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均損失pips</div>
                    <div className="font-medium text-red-600">{(data.avgLossPips || 0).toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均利益保有時間</div>
                    <div className="font-medium text-blue-600">
                      {(data.avgWinHoldingTime || 0) > 0 ? formatHoldingTime(data.avgWinHoldingTime || 0) : "データなし"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均損失保有時間</div>
                    <div className="font-medium text-blue-600">
                      {(data.avgLossHoldingTime || 0) > 0 ? formatHoldingTime(data.avgLossHoldingTime || 0) : "データなし"}
                    </div>
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
    
    // Fetch monthly performance data from user_performance_metrics for the selected year
    supabase
      .from("user_performance_metrics")
      .select("*")
      .eq("user_id", user.id)
      .eq("period_type", "monthly")
      .like("period_value", `${selectedYear}-%`)
      .order("period_value", { ascending: true })
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
      const monthString = monthNumber.toString().padStart(2, '0');
      
      // Match by period_value format "YYYY-MM"
      let monthData = performanceData.find(data => {
        const periodValue = data.period_value;
        return periodValue && periodValue.endsWith(`-${monthString}`);
      });

      if (!monthData) {
        // Return default values for months without data
        return {
          month,
          trades: 0,
          winRate: 0,
          profit: 0,
          avgWinProfit: 0,
          avgLossLoss: 0,
          avgWinPips: 0,
          avgLossPips: 0,
          avgWinHoldingTime: 0,
          avgLossHoldingTime: 0
        };
      }

      // Calculate values from raw data
      const totalTrades = (monthData.win_count || 0) + (monthData.loss_count || 0);
      const winRate = totalTrades > 0 
        ? ((monthData.win_count || 0) / totalTrades) * 100 
        : 0;
      const profit = (monthData.win_profit || 0) + (monthData.loss_loss || 0);
      const avgWinProfit = (monthData.win_count || 0) > 0 
        ? (monthData.win_profit || 0) / (monthData.win_count || 0) 
        : 0;
      const avgLossLoss = (monthData.loss_count || 0) > 0 
        ? (monthData.loss_loss || 0) / (monthData.loss_count || 0) 
        : 0;
      
      // Calculate average pips using the new count columns
      const avgWinPips = (monthData.win_pips_count || 0) > 0 
        ? (monthData.win_pips || 0) / (monthData.win_pips_count || 0) 
        : 0;
      const avgLossPips = (monthData.loss_pips_count || 0) > 0 
        ? (monthData.loss_pips || 0) / (monthData.loss_pips_count || 0) 
        : 0;
      
      // Calculate average holding time using the new count columns
      const avgWinHoldingTime = (monthData.win_holding_count || 0) > 0 
        ? (monthData.win_holding_time || 0) / (monthData.win_holding_count || 0) 
        : 0;
      const avgLossHoldingTime = (monthData.loss_holding_count || 0) > 0 
        ? (monthData.loss_holding_time || 0) / (monthData.loss_holding_count || 0) 
        : 0;

      return {
        month,
        trades: totalTrades,
        winRate: winRate,
        profit: profit,
        avgWinProfit: avgWinProfit,
        avgLossLoss: avgLossLoss,
        avgWinPips: avgWinPips,
        avgLossPips: avgLossPips,
        avgWinHoldingTime: avgWinHoldingTime,
        avgLossHoldingTime: avgLossHoldingTime
      };
    });

    return monthlyStats;
  };

  const formatHoldingTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}日`);
    if (hours > 0 || days > 0) parts.push(`${hours}時間`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}分`);
    parts.push(`${secs}秒`);
    
    return parts.join(' ');
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

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm text-muted-foreground">取引数: {month.trades || 0}件</div>
                  <div className="text-sm text-muted-foreground">勝率: {(month.winRate || 0).toFixed(1)}%</div>
                  <div className={`text-sm font-medium ${(month.profit || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                    総損益: ¥{(month.profit || 0).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">平均利益</div>
                    <div className="font-medium text-green-600">¥{(month.avgWinProfit || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均損失</div>
                    <div className="font-medium text-red-600">¥{(month.avgLossLoss || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均利益pips</div>
                    <div className="font-medium text-green-600">{(month.avgWinPips || 0).toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均損失pips</div>
                    <div className="font-medium text-red-600">{(month.avgLossPips || 0).toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均利益保有時間</div>
                    <div className="font-medium text-blue-600">
                      {(month.avgWinHoldingTime || 0) > 0 ? formatHoldingTime(month.avgWinHoldingTime || 0) : "データなし"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均損失保有時間</div>
                    <div className="font-medium text-blue-600">
                      {(month.avgLossHoldingTime || 0) > 0 ? formatHoldingTime(month.avgLossHoldingTime || 0) : "データなし"}
                    </div>
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

export default function AnalysisPage() {
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
