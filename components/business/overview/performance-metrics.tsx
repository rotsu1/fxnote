import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PerformanceMetrics({ settingsVersion }: { settingsVersion: number }) {
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
  
    const getRangeForPeriod = (periodType: 'daily' | 'monthly' | 'yearly') => {
      const now = new Date();
      const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (periodType === 'daily') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { startDate: toYmd(start), endDate: toYmd(end) };
      }
      if (periodType === 'monthly') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: toYmd(start), endDate: toYmd(end) };
      }
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { startDate: toYmd(start), endDate: toYmd(end) };
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
  
          // Query trades within the appropriate range and aggregate
          let trades: any[] = [];
          if (period.period_type === 'total') {
            const { data: allTrades, error: allError } = await supabase
              .from("trades")
              .select("profit_loss")
              .eq("user_id", user.id);
            if (allError) throw allError;
            trades = allTrades || [];
          } else {
            const { startDate, endDate } = getRangeForPeriod(period.period_type as 'daily' | 'monthly' | 'yearly');
            const { data: rangedTrades, error: rangeError } = await supabase
              .from("trades")
              .select("profit_loss")
              .eq("user_id", user.id)
              .gte("entry_date", startDate)
              .lte("entry_date", endDate);
            if (rangeError) throw rangeError;
            trades = rangedTrades || [];
          }
  
          // Aggregate performance metrics
          const aggregated = trades.reduce((acc, t) => {
            const profit = t.profit_loss || 0;
            if (profit > 0) {
              acc.win_count += 1;
              acc.win_profit += profit;
            } else if (profit < 0) {
              acc.loss_count += 1;
              acc.loss_loss += profit; // negative
            }
            return acc;
          }, { win_count: 0, loss_count: 0, win_profit: 0, loss_loss: 0 });
  
          setPerformanceData({
            ...aggregated,
            period_type: period.period_type,
            period_value: period.period_value,
          });
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
  
    // Use default values if no performance data is available
    const defaultData = {
      win_count: 0,
      loss_count: 0,
      win_profit: 0,
      loss_loss: 0
    };
  
    const data = performanceData || defaultData;
  
    // Compute derived values
    const winCount = data.win_count || 0;
    const lossCount = data.loss_count || 0;
    const tradeCount = winCount + lossCount;
    const winProfit = data.win_profit || 0;
    const lossLoss = data.loss_loss || 0;
  
    const winRate = tradeCount > 0 
      ? `${Math.round((winCount / tradeCount) * 100)}%` 
      : '0%';
  
    const averageProfitLoss = tradeCount > 0 
      ? new Intl.NumberFormat('ja-JP', { 
          style: 'currency', 
          currency: 'JPY' 
        }).format((winProfit + lossLoss) / tradeCount)
      : '¥0';
  
    const tradeCountDisplay = tradeCount > 0 
      ? `${tradeCount}回` 
      : '0回';
  
    const performanceMetrics = [
      { 
        title: "勝率", 
        value: winRate, 
        description: tradeCount > 0 
          ? `${winCount}勝 / ${tradeCount}取引` 
          : "0勝 / 0取引" 
      },
      { 
        title: "平均利益/損失", 
        value: averageProfitLoss, 
        description: "取引平均" 
      },
      { 
        title: "取引回数", 
        value: tradeCountDisplay, 
        description: "取引履歴" 
      },
    ];
  
  
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>パフォーマンス指標</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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