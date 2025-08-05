"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Settings } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"


function PLSummaryCards() {
  const [plSummary, setPlSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const user = useAuth();

  // Helper function to get current period values
  const getCurrentPeriods = () => {
    const now = new Date();
    
    // Daily: today's date
    const daily = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Monthly: current month
    const monthly = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Yearly: current year
    const yearly = now.getFullYear().toString();
    
    return { daily, monthly, yearly };
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchPLSummary = async () => {
      setLoading(true);
      setError("");
      
      try {
        const periods = getCurrentPeriods();
        
        // Fetch data for all periods - handle each query individually to avoid 406 errors
        let dailyProfit = 0, monthlyProfit = 0, yearlyProfit = 0, totalProfit = 0;
        
        // Daily data
        try {
          const { data: dailyData, error: dailyError } = await supabase
            .from("user_performance_metrics")
            .select("win_profit, loss_loss")
            .eq("user_id", user.id)
            .eq("period_type", "daily")
            .eq("period_value", periods.daily)
            .maybeSingle(); // Use maybeSingle instead of single

          if (dailyData) {
            dailyProfit = (dailyData.win_profit || 0) + (dailyData.loss_loss || 0);
          }
        } catch (dailyError) {
          console.log("No daily data found for period:", periods.daily);
        }

        // Monthly data
        try {
          const { data: monthlyData, error: monthlyError } = await supabase
            .from("user_performance_metrics")
            .select("win_profit, loss_loss")
            .eq("user_id", user.id)
            .eq("period_type", "monthly")
            .eq("period_value", periods.monthly)
            .maybeSingle(); // Use maybeSingle instead of single

          if (monthlyData) {
            monthlyProfit = (monthlyData.win_profit || 0) + (monthlyData.loss_loss || 0);
          }
        } catch (monthlyError) {
          console.log("No monthly data found for period:", periods.monthly);
        }

        // Yearly data - sum all months in the current year
        try {
          const { data: yearlyData, error: yearlyError } = await supabase
            .from("user_performance_metrics")
            .select("win_profit, loss_loss")
            .eq("user_id", user.id)
            .eq("period_type", "monthly")
            .like("period_value", `${periods.yearly}-%`);

          if (yearlyData && yearlyData.length > 0) {
            yearlyProfit = yearlyData.reduce((sum, month) => {
              return sum + (month.win_profit || 0) + (month.loss_loss || 0);
            }, 0);
          }
        } catch (yearlyError) {
          console.log("No yearly data found for year:", periods.yearly);
        }

        // Total data - sum all months
        try {
          const { data: totalData, error: totalError } = await supabase
            .from("user_performance_metrics")
            .select("win_profit, loss_loss")
            .eq("user_id", user.id)
            .eq("period_type", "monthly");

          console.log("Total query result:", { totalData, totalError, count: totalData?.length });

          if (totalData && totalData.length > 0) {
            totalProfit = totalData.reduce((sum, month) => {
              const monthProfit = (month.win_profit || 0) + (month.loss_loss || 0);
              console.log("Month:", month, "Profit:", monthProfit);
              return sum + monthProfit;
            }, 0);
            console.log("Final total profit:", totalProfit);
          } else {
            console.log("No monthly data found for total");
          }
        } catch (totalError) {
          console.log("Error fetching total data:", totalError);
        }

        console.log("Setting plSummary with values:", { dailyProfit, monthlyProfit, yearlyProfit, totalProfit });
        setPlSummary({
          daily_profit: dailyProfit,
          monthly_profit: monthlyProfit,
          yearly_profit: yearlyProfit,
          total_profit: totalProfit
        });

      } catch (error: any) {
        console.error("Error fetching PL summary:", error);
        setError(error.message || "データの取得に失敗しました");
        setPlSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPLSummary();
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

  console.log("plSummary values for display:", plSummary);
  const summaryData = [
    { 
      title: "今日の損益", 
      value: `¥${(plSummary.daily_profit || 0).toLocaleString()}`, 
      trend: plSummary.daily_profit > 0 ? "up" : plSummary.daily_profit < 0 ? "down" : "neutral", 
      color: plSummary.daily_profit > 0 ? "text-green-600" : plSummary.daily_profit < 0 ? "text-red-600" : "text-muted-foreground" 
    },
    { 
      title: "今月の損益", 
      value: `¥${(plSummary.monthly_profit || 0).toLocaleString()}`, 
      trend: plSummary.monthly_profit > 0 ? "up" : plSummary.monthly_profit < 0 ? "down" : "neutral", 
      color: plSummary.monthly_profit > 0 ? "text-green-600" : plSummary.monthly_profit < 0 ? "text-red-600" : "text-muted-foreground" 
    },
    { 
      title: "今年の損益", 
      value: `¥${(plSummary.yearly_profit || 0).toLocaleString()}`, 
      trend: plSummary.yearly_profit > 0 ? "up" : plSummary.yearly_profit < 0 ? "down" : "neutral", 
      color: plSummary.yearly_profit > 0 ? "text-green-600" : plSummary.yearly_profit < 0 ? "text-red-600" : "text-muted-foreground" 
    },
    { 
      title: "総損益", 
      value: `¥${(plSummary.total_profit || 0).toLocaleString()}`, 
      trend: plSummary.total_profit > 0 ? "up" : plSummary.total_profit < 0 ? "down" : "neutral", 
      color: plSummary.total_profit > 0 ? "text-green-600" : plSummary.total_profit < 0 ? "text-red-600" : "text-muted-foreground" 
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
              ) : item.trend === "down" ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <div className="h-4 w-4" /> // Neutral state - no icon
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

function PerformanceMetrics({ settingsVersion }: { settingsVersion: number }) {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const user = useAuth();

  // Helper function to get current period based on metrics_period
  const getCurrentPeriod = (metricsPeriod: number) => {
    const now = new Date();
    
    switch (metricsPeriod) {
      case 0: // daily
        return {
          period_type: 'daily',
          period_value: now.toISOString().split('T')[0] // YYYY-MM-DD
        };
      case 1: // monthly
        return {
          period_type: 'monthly',
          period_value: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
        };
      case 2: // yearly
        return {
          period_type: 'yearly',
          period_value: now.getFullYear().toString()
        };
      case 3: // total
        return {
          period_type: 'total',
          period_value: 'total'
        };
      default:
        return {
          period_type: 'monthly',
          period_value: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
        };
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchPerformanceData = async () => {
      setLoading(true);
      setError("");
      
      try {
        // First, fetch the user's metrics_period setting
        const { data: settingsData, error: settingsError } = await supabase
          .from("dashboard_settings")
          .select("metrics_period")
          .eq("user_id", user.id)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 is "not found"
          throw settingsError;
        }

        // Default to monthly (1) if no settings found
        const metricsPeriod = settingsData?.metrics_period ?? 1;
        const period = getCurrentPeriod(metricsPeriod);

        // Fetch performance data with the computed period
        let data, error;
        
        if (period.period_type === 'yearly') {
          // For yearly, sum all months in the current year
          const { data: yearlyData, error: yearlyError } = await supabase
            .from("user_performance_metrics")
            .select("*")
            .eq("user_id", user.id)
            .eq("period_type", "monthly")
            .like("period_value", `${period.period_value}-%`);
          
          data = yearlyData;
          error = yearlyError;
          
          // Aggregate the data if we have multiple months
          if (data && data.length > 0) {
            const aggregatedData = data.reduce((acc, month) => {
              return {
                win_count: (acc.win_count || 0) + (month.win_count || 0),
                loss_count: (acc.loss_count || 0) + (month.loss_count || 0),
                win_profit: (acc.win_profit || 0) + (month.win_profit || 0),
                loss_loss: (acc.loss_loss || 0) + (month.loss_loss || 0),
                period_type: 'yearly',
                period_value: period.period_value
              };
            }, {});
            data = aggregatedData;
          }
        } else if (period.period_type === 'total') {
          // For total, sum all months
          const { data: totalData, error: totalError } = await supabase
            .from("user_performance_metrics")
            .select("*")
            .eq("user_id", user.id)
            .eq("period_type", "monthly");
          
          data = totalData;
          error = totalError;
          
          // Aggregate the data if we have multiple months
          if (data && data.length > 0) {
            const aggregatedData = data.reduce((acc, month) => {
              return {
                win_count: (acc.win_count || 0) + (month.win_count || 0),
                loss_count: (acc.loss_count || 0) + (month.loss_count || 0),
                win_profit: (acc.win_profit || 0) + (month.win_profit || 0),
                loss_loss: (acc.loss_loss || 0) + (month.loss_loss || 0),
                period_type: 'total',
                period_value: 'total'
              };
            }, {});
            data = aggregatedData;
          }
        } else {
          // For daily and monthly, fetch single record
          const { data: singleData, error: singleError } = await supabase
            .from("user_performance_metrics")
            .select("*")
            .eq("user_id", user.id)
            .eq("period_type", period.period_type)
            .eq("period_value", period.period_value)
            .maybeSingle();
          
          data = singleData;
          error = singleError;
        }

        if (error) {
          console.error("Error fetching performance data:", error);
          // Don't throw error if no data found, just set to null
          setPerformanceData(null);
        } else {
          setPerformanceData(data || null);
        }
      } catch (error: any) {
        console.error("Error fetching performance data:", error);
        setError(error.message || "データの取得に失敗しました");
        setPerformanceData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [user, settingsVersion]); // Add settingsVersion to dependencies

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

  // Compute derived values
  const winCount = performanceData.win_count || 0;
  const lossCount = performanceData.loss_count || 0;
  const tradeCount = winCount + lossCount;
  const winProfit = performanceData.win_profit || 0;
  const lossLoss = performanceData.loss_loss || 0;

  const winRate = tradeCount > 0 
    ? `${Math.round((winCount / tradeCount) * 100)}%` 
    : 'N/A';

  const averageProfitLoss = tradeCount > 0 
    ? new Intl.NumberFormat('ja-JP', { 
        style: 'currency', 
        currency: 'JPY' 
      }).format((winProfit + lossLoss) / tradeCount)
    : 'N/A';

  const tradeCountDisplay = tradeCount > 0 
    ? `${tradeCount}回` 
    : 'N/A';

  const performanceMetrics = [
    { 
      title: "勝率", 
      value: winRate, 
      description: tradeCount > 0 
        ? `${winCount}勝 / ${tradeCount}取引` 
        : "データなし" 
    },
    { 
      title: "平均利益/損失", 
      value: averageProfitLoss, 
      description: "取引平均" 
    },
    { 
      title: "取引回数", 
      value: tradeCountDisplay, 
      description: "データなし" 
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

function DashboardSettings({ onSettingsChange }: { onSettingsChange?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [metricsPeriod, setMetricsPeriod] = useState<string>("1"); // Default to monthly (1)
  const [loading, setLoading] = useState(false);
  const user = useAuth();
  const { toast } = useToast();

  // Period options mapping
  const periodOptions = [
    { value: "0", label: "日次" },
    { value: "1", label: "月次" },
    { value: "2", label: "年次" },
    { value: "3", label: "総計" },
  ];

  // Load current settings
  useEffect(() => {
    if (!user || !isOpen) return;

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("dashboard_settings")
          .select("metrics_period")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error("Error loading settings:", error);
          return;
        }

        if (data) {
          setMetricsPeriod(data.metrics_period?.toString() || "1");
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, [user, isOpen]);

  // Save settings
  const handleSaveSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First check if a row exists for this user
      const { data: existingSettings, error: checkError } = await supabase
        .from("dashboard_settings")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw checkError;
      }

      let error;
      if (existingSettings) {
        // Update existing row
        const { error: updateError } = await supabase
          .from("dashboard_settings")
          .update({ metrics_period: parseInt(metricsPeriod) })
          .eq("user_id", user.id);
        error = updateError;
      } else {
        // Insert new row if none exists
        const { error: insertError } = await supabase
          .from("dashboard_settings")
          .insert({
            user_id: user.id,
            metrics_period: parseInt(metricsPeriod),
          });
        error = insertError;
      }

      if (error) {
        throw error;
      }

      toast({
        title: "設定を保存しました",
        description: "パフォーマンス指標の期間設定が更新されました。",
      });

      // Trigger refresh of performance metrics
      if (onSettingsChange) {
        onSettingsChange();
      }

      setIsOpen(false);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "エラーが発生しました",
        description: "設定の保存に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">設定</span>
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ダッシュボード設定</DialogTitle>
          <DialogDescription>
            ダッシュボードの表示設定を変更できます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="performance-period" className="text-right">
              パフォーマンス指標期間:
            </Label>
            <div className="col-span-3">
              <Select value={metricsPeriod} onValueChange={setMetricsPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="期間を選択" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? "保存中..." : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TradingDashboard() {
  const [settingsVersion, setSettingsVersion] = useState<number>(0);

  const handleSettingsChange = () => {
    // Force immediate refresh of performance metrics
    setSettingsVersion(prev => prev + 1);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">ダッシュボード</h1>
            <DashboardSettings onSettingsChange={handleSettingsChange} />
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
