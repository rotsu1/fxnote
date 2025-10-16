import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { formatHoldTime } from "@/utils/ui/timeUtils";

export function TimeAnalysis({ filterTags = [], filterEmotions = [], locked = false }: { filterTags?: string[]; filterEmotions?: string[]; locked?: boolean }) {
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
      if (!user) {
        return;
      }
      // If locked (freemium), show default zeros and skip fetching
      if (locked) {
        const timeSlots = Array.from({ length: 24 }, (_, h) => ({
          time: `${String(h).padStart(2, '0')}:00-${String((h + 1) % 24).padStart(2, '0')}:00`,
          wins: 0,
          losses: 0,
          avgPips: 0,
          performance: 'neutral',
          totalProfit: 0,
          avgWinProfit: 0,
          avgLossLoss: 0,
          avgWinPips: 0,
          avgLossPips: 0,
          avgWinHoldingTime: 0,
          avgLossHoldingTime: 0,
        }))
        setTimeData(timeSlots)
        setLoading(false)
        setError("")
        return
      }
      
      setLoading(true);
      setError("");
      
      // Calculate date range for the selected year and month (local)
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
      // Widen UTC fetch range by +/- 1 day to include timezone edge cases
      const startFetch = new Date(startDate);
      startFetch.setDate(startFetch.getDate() - 1);
      const endFetch = new Date(endDate);
      endFetch.setDate(endFetch.getDate() + 1);
  
      const startFetchYmd = toYmd(startFetch);
      const endFetchYmd = toYmd(endFetch);
      
      // Fetch trades around the selected month using entry_date
      supabase
        .from("trades")
        .select("id, user_id, profit_loss, pips, hold_time, entry_date, entry_time")
        .eq("user_id", user.id)
        .gte("entry_date", startFetchYmd)
        .lte("entry_date", endFetchYmd)
        .then(async ({ data, error }) => {
          
          if (error) {
            console.error('TimeAnalysis: Error fetching trades:', error);
            setError(error.message);
            setTimeData([]);
            setLoading(false);
            return;
          }
  
          let dataInMonth = (data || []).filter((trade: any) => {
            if (!trade.entry_date) return false;
            const dt = new Date(`${trade.entry_date}T${(trade.entry_time || '00:00:00')}Z`);
            if (isNaN(dt.getTime())) return false;
            return dt.getFullYear() === selectedYear && (dt.getMonth() + 1) === selectedMonth;
          });

          // Apply tag/emotion filters if provided
          if ((filterTags && filterTags.length > 0) || (filterEmotions && filterEmotions.length > 0)) {
            const ids = dataInMonth.map((t: any) => t.id);
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

              dataInMonth = dataInMonth.filter((t: any) => {
                const tagOk = !filterTags || filterTags.length === 0 || (tagsByTrade[t.id] && filterTags.some(tag => tagsByTrade[t.id].has(tag)));
                const emoOk = !filterEmotions || filterEmotions.length === 0 || (emosByTrade[t.id] && filterEmotions.some(em => emosByTrade[t.id].has(em)));
                return tagOk && emoOk;
              });
            } else {
              dataInMonth = [];
            }
          }
  
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
            const hourTrades = dataInMonth.filter(trade => {
              if (!trade.entry_time) return false;
              let hour: number | null = null;
              const dt = new Date(`${trade.entry_date}T${trade.entry_time}Z`);
              if (!isNaN(dt.getTime())) hour = dt.getHours();
              if (hour === null) {
                const parts = String(trade.entry_time).split(":");
                if (parts.length >= 1) {
                  const parsed = parseInt(parts[0], 10);
                  if (!isNaN(parsed)) hour = parsed;
                }
              }
              if (hour === null) return false;
              return hour === timeSlot.hour;
            });
            
            if (hourTrades.length === 0) {
              return {
                time: timeSlot.label,
                wins: 0,
                losses: 0,
                avgPips: 0,
                performance: "neutral"
              };
            }
            
            let wins = 0;
            let losses = 0;
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
                lossLoss += profit; // negative
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
            
            const avgWinProfit = wins > 0 ? winProfit / wins : 0;
            const avgLossLoss = losses > 0 ? lossLoss / losses : 0;
            const avgWinPips = winCountWithPips > 0 ? winPips / winCountWithPips : 0;
            const avgLossPips = lossCountWithPips > 0 ? lossPips / lossCountWithPips : 0;
            // Calculate average holding time only for trades with valid holding time data
            const avgWinHoldingTime = winCountWithHoldingTime > 0 ? winHoldingTime / winCountWithHoldingTime : 0;
            const avgLossHoldingTime = lossCountWithHoldingTime > 0 ? lossHoldingTime / lossCountWithHoldingTime : 0;
            
            return {
              time: timeSlot.label,
              wins,
              losses,
              totalProfit,
              avgWinProfit,
              avgLossLoss,
              avgWinPips,
              avgLossPips,
              avgWinHoldingTime,
              avgLossHoldingTime
            };
          });
          
          setTimeData(processedData);
          setLoading(false);
        });
    }, [user, selectedYear, selectedMonth, filterTags, filterEmotions, locked]);
  
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
                        {(data.avgWinHoldingTime || 0) > 0 ? formatHoldTime(data.avgWinHoldingTime || 0) : "データなし"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">平均損失保有時間</div>
                      <div className="font-medium text-blue-600">
                        {(data.avgLossHoldingTime || 0) > 0 ? formatHoldTime(data.avgLossHoldingTime || 0) : "データなし"}
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
  
