import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { formatHoldTime } from "@/utils/ui/timeUtils";

export function MonthlyBreakdown({ filterTags = [], filterEmotions = [] }: { filterTags?: string[]; filterEmotions?: string[] }) {
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
      
      // Fetch trades within the selected year and compute monthly metrics
      const y = selectedYear;
      supabase
        .from("trades")
        .select("id,profit_loss,pips,hold_time,entry_date,entry_time")
        .eq("user_id", user.id)
        .gte("entry_date", `${y}-01-01`)
        .lte("entry_date", `${y}-12-31`)
        .then(async ({ data, error }) => {
          if (error) {
            setError(error.message);
            setMonthlyData([]);
          } else {
            const months = [
              "1月", "2月", "3月", "4月", "5月", "6月",
              "7月", "8月", "9月", "10月", "11月", "12月"
            ];
  
            // Apply tag/emotion filters on the whole year's data first
            let filteredYearData = data || [];
            if ((filterTags && filterTags.length > 0) || (filterEmotions && filterEmotions.length > 0)) {
              const ids = filteredYearData.map((t: any) => t.id);
              if (ids.length > 0) {
                const [tagLinksRes, emoLinksRes] = await Promise.all([
                  supabase
                    .from('trade_tag_links')
                    .select('trade_id, trade_tags!inner(tag_name)')
                    .in('trade_id', ids),
                  supabase
                    .from('trade_emotion_links')
                    .select('trade_id, emotions!inner(emotion)')
                    .in('trade_id', ids)
                ]);
                const tagsByTrade: Record<number, Set<string>> = {};
                const emosByTrade: Record<number, Set<string>> = {};
                (tagLinksRes.data || []).forEach((row: any) => {
                  tagsByTrade[row.trade_id] = tagsByTrade[row.trade_id] || new Set();
                  if (row.trade_tags?.tag_name) tagsByTrade[row.trade_id].add(row.trade_tags.tag_name);
                });
                (emoLinksRes.data || []).forEach((row: any) => {
                  emosByTrade[row.trade_id] = emosByTrade[row.trade_id] || new Set();
                  if (row.emotions?.emotion) emosByTrade[row.trade_id].add(row.emotions.emotion);
                });
                filteredYearData = filteredYearData.filter((t: any) => {
                  const tagOk = !filterTags || filterTags.length === 0 || (tagsByTrade[t.id] && filterTags.some(tag => tagsByTrade[t.id].has(tag)));
                  const emoOk = !filterEmotions || filterEmotions.length === 0 || (emosByTrade[t.id] && filterEmotions.some(em => emosByTrade[t.id].has(em)));
                  return tagOk && emoOk;
                });
              } else {
                filteredYearData = [];
              }
            }

            const monthlyStats = months.map((month, index) => {
              const m = index + 1;
              const monthTrades = (filteredYearData || []).filter((t: any) => {
                if (!t.entry_date) return false;
                const dt = new Date(`${t.entry_date}T${(t.entry_time || '00:00:00')}Z`);
                if (isNaN(dt.getTime())) return false;
                const ty = dt.getFullYear();
                const tm = dt.getMonth() + 1;
                return ty === y && tm === m;
              });
  
              if (monthTrades.length === 0) {
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
  
              const wins = monthTrades.filter((t: any) => (t.profit_loss || 0) > 0);
              const losses = monthTrades.filter((t: any) => (t.profit_loss || 0) < 0);
  
              const winCount = wins.length;
              const lossCount = losses.length;
              const total = winCount + lossCount;
  
              const profitSum = monthTrades.reduce((s: number, t: any) => s + (t.profit_loss || 0), 0);
              const winProfitSum = wins.reduce((s: number, t: any) => s + (t.profit_loss || 0), 0);
              const lossLossSum = losses.reduce((s: number, t: any) => s + (t.profit_loss || 0), 0);
  
              const avgWinProfit = winCount > 0 ? winProfitSum / winCount : 0;
              const avgLossLoss = lossCount > 0 ? lossLossSum / lossCount : 0;
  
              // Calculate average pips only for trades with valid pips data
              const winTradesWithPips = wins.filter((t: any) => t.pips !== null && t.pips !== undefined);
              const lossTradesWithPips = losses.filter((t: any) => t.pips !== null && t.pips !== undefined);
              
              const avgWinPips = winTradesWithPips.length > 0 ? winTradesWithPips.reduce((s: number, t: any) => s + (t.pips || 0), 0) / winTradesWithPips.length : 0;
              const avgLossPips = lossTradesWithPips.length > 0 ? lossTradesWithPips.reduce((s: number, t: any) => s + (t.pips || 0), 0) / lossTradesWithPips.length : 0;
  
              // Calculate average holding time only for trades with valid holding time data
              const winTradesWithHoldingTime = wins.filter((t: any) => t.hold_time && t.hold_time > 0);
              const lossTradesWithHoldingTime = losses.filter((t: any) => t.hold_time && t.hold_time > 0);
              
              const avgWinHoldingTime = winTradesWithHoldingTime.length > 0 ? winTradesWithHoldingTime.reduce((s: number, t: any) => s + (t.hold_time || 0), 0) / winTradesWithHoldingTime.length : 0;
              const avgLossHoldingTime = lossTradesWithHoldingTime.length > 0 ? lossTradesWithHoldingTime.reduce((s: number, t: any) => s + (t.hold_time || 0), 0) / lossTradesWithHoldingTime.length : 0;
  
              const winRate = total > 0 ? (winCount / total) * 100 : 0;
  
              return {
                month,
                trades: total,
                winRate,
                profit: profitSum,
                avgWinProfit,
                avgLossLoss,
                avgWinPips,
                avgLossPips,
                avgWinHoldingTime,
                avgLossHoldingTime
              };
            });
  
            setMonthlyData(monthlyStats);
          }
          setLoading(false);
        });
    }, [user, selectedYear, filterTags, filterEmotions]);
  
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
  
        const avgWinHoldingTime = (monthData.win_count || 0) > 0 
          ? (monthData.win_holding_time || 0) / (monthData.win_count || 0) 
          : 0;
        const avgLossHoldingTime = (monthData.loss_count || 0) > 0 
          ? (monthData.loss_holding_time || 0) / (monthData.loss_count || 0) 
          : 0;
  
        return {
          month,
          trades: totalTrades,
          winRate,
          profit,
          avgWinProfit,
          avgLossLoss,
          avgWinPips,
          avgLossPips,
          avgWinHoldingTime,
          avgLossHoldingTime
        };
      });
      
      return monthlyStats;
    };
  
    if (loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>月別成績</CardTitle>
            <CardDescription>選択した年の月ごとのパフォーマンス</CardDescription>
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
            <CardTitle>月別成績</CardTitle>
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
                        {(month.avgWinHoldingTime || 0) > 0 ? formatHoldTime(month.avgWinHoldingTime || 0) : "データなし"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">平均損失保有時間</div>
                      <div className="font-medium text-blue-600">
                        {(month.avgLossHoldingTime || 0) > 0 ? formatHoldTime(month.avgLossHoldingTime || 0) : "データなし"}
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
