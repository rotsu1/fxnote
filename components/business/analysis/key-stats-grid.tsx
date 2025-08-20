import { useAuth } from "@/hooks/useAuth";
import { KeyStatsGridProps, Metric } from "@/utils/core/types";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KeyStatsGrid({ selectedYear, selectedMonth, selectedDay }: KeyStatsGridProps) {
    const user = useAuth();
    const [keyStats, setKeyStats] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
  
    useEffect(() => {
      if (!user) return;
      
      setLoading(true);
      setError("");
  
      // Build optional year range to reduce result size
      let query = supabase
        .from("trades")
        .select("profit_loss,pips,hold_time,entry_date,entry_time")
        .eq("user_id", user.id);
  
      // Fetch a broad range by year if specified to include timezone edge cases
      if (selectedYear !== "指定しない") {
        const y = selectedYear as number;
        query = query.gte("entry_date", `${y}-01-01`).lte("entry_date", `${y}-12-31`);
      }
  
      query.then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setKeyStats(null);
          setLoading(false);
          return;
        }
  
        const trades = (data || []).filter((t: any) => {
          if (!t.entry_date) return false;
          const dt = new Date(`${t.entry_date}T${(t.entry_time || '00:00:00')}Z`);
          if (isNaN(dt.getTime())) return false;
          const ty = dt.getFullYear();
          const tm = dt.getMonth() + 1;
          const td = dt.getDate();
          if (selectedYear !== "指定しない" && ty !== selectedYear) return false;
          if (selectedMonth !== "指定しない" && tm !== selectedMonth) return false;
          if (selectedDay !== "指定しない" && td !== selectedDay) return false;
          return true;
        });
  
        const wins = trades.filter((t: any) => (t.profit_loss || 0) > 0);
        const losses = trades.filter((t: any) => (t.profit_loss || 0) < 0);
  
        const winCount = wins.length;
        const lossCount = losses.length;
        const totalCount = winCount + lossCount;
  
        const winProfitSum = wins.reduce((s: number, t: any) => s + (t.profit_loss || 0), 0);
        const lossLossSum = losses.reduce((s: number, t: any) => s + (t.profit_loss || 0), 0); // negative sum
  
        // Calculate average pips only for trades with valid pips data
        const winTradesWithPips = wins.filter((t: any) => t.pips !== null && t.pips !== undefined);
        const lossTradesWithPips = losses.filter((t: any) => t.pips !== null && t.pips !== undefined);
        
        const winPipsAvg = winTradesWithPips.length > 0 ? winTradesWithPips.reduce((s: number, t: any) => s + (t.pips || 0), 0) / winTradesWithPips.length : 0;
        const lossPipsAvg = lossTradesWithPips.length > 0 ? lossTradesWithPips.reduce((s: number, t: any) => s + (t.pips || 0), 0) / lossTradesWithPips.length : 0;
  
        // Calculate average holding time only for trades with valid holding time data
        const winTradesWithHoldingTime = wins.filter((t: any) => t.hold_time && t.hold_time > 0);
        const lossTradesWithHoldingTime = losses.filter((t: any) => t.hold_time && t.hold_time > 0);
        
        const winHoldAvg = winTradesWithHoldingTime.length > 0 ? winTradesWithHoldingTime.reduce((s: number, t: any) => s + (t.hold_time || 0), 0) / winTradesWithHoldingTime.length : 0;
        const lossHoldAvg = lossTradesWithHoldingTime.length > 0 ? lossTradesWithHoldingTime.reduce((s: number, t: any) => s + (t.hold_time || 0), 0) / lossTradesWithHoldingTime.length : 0;
  
        const winRate = totalCount > 0 ? (winCount / totalCount) * 100 : 0;
        const avgWinProfit = winCount > 0 ? winProfitSum / winCount : 0;
        const avgLossLoss = lossCount > 0 ? lossLossSum / lossCount : 0;
        const payoffRatio = lossCount > 0 && Math.abs(avgLossLoss) > 0 ? avgWinProfit / Math.abs(avgLossLoss) : 0;
  
        setKeyStats({
          win_rate: winRate,
          avg_win_trade_profit: avgWinProfit,
          avg_loss_trade_loss: avgLossLoss,
          avg_win_trade_pips: winPipsAvg,
          avg_loss_trade_pips: lossPipsAvg,
          avg_win_holding_time: winHoldAvg,
          avg_loss_holding_time: lossHoldAvg,
          payoff_ratio: payoffRatio,
        });
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
  
    // Create default stats when no data is available
    const defaultStats = {
      win_rate: 0,
      avg_win_trade_profit: 0,
      avg_loss_trade_loss: 0,
      avg_win_trade_pips: 0,
      avg_loss_trade_pips: 0,
      avg_win_holding_time: 0,
      avg_loss_holding_time: 0,
      payoff_ratio: 0
    };
  
    // Use default stats if no data is available
    const statsToUse = keyStats || defaultStats;
  
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
        format: (value: number | string) => typeof value === "number" ? `${(Math.abs(value)).toLocaleString()}` : value,
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.key}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${metric.color(statsToUse[metric.key])}`}>{metric.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color(statsToUse[metric.key])}`}>
                {metric.format(statsToUse[metric.key])}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }