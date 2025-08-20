import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export function PLSummaryCards() {
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
  
    // Helper to build period date ranges (YYYY-MM-DD strings)
    const getPeriodRange = (type: 'daily' | 'monthly' | 'yearly') => {
      const now = new Date();
      const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (type === 'daily') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { startDate: toYmd(start), endDate: toYmd(end) };
      }
      if (type === 'monthly') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: toYmd(start), endDate: toYmd(end) };
      }
      // yearly
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { startDate: toYmd(start), endDate: toYmd(end) };
    };
  
    useEffect(() => {
      if (!user) return;
      
      const fetchPLSummary = async () => {
        setLoading(true);
        setError("");
        
        try {
          // Compute profits by querying trades within periods
          let dailyProfit = 0, monthlyProfit = 0, yearlyProfit = 0, totalProfit = 0;
  
          const { startDate: dailyStart, endDate: dailyEnd } = getPeriodRange('daily');
          const { startDate: monthlyStart, endDate: monthlyEnd } = getPeriodRange('monthly');
          const { startDate: yearlyStart, endDate: yearlyEnd } = getPeriodRange('yearly');
  
          const [dailyRes, monthlyRes, yearlyRes, totalRes] = await Promise.all([
            supabase
              .from("trades")
              .select("profit_loss")
              .eq("user_id", user.id)
              .gte("entry_date", dailyStart)
              .lte("entry_date", dailyEnd),
            supabase
              .from("trades")
              .select("profit_loss")
              .eq("user_id", user.id)
              .gte("entry_date", monthlyStart)
              .lte("entry_date", monthlyEnd),
            supabase
              .from("trades")
              .select("profit_loss")
              .eq("user_id", user.id)
              .gte("entry_date", yearlyStart)
              .lte("entry_date", yearlyEnd),
            supabase
              .from("trades")
              .select("profit_loss")
              .eq("user_id", user.id)
          ]);
  
          if (dailyRes.error) throw dailyRes.error;
          if (monthlyRes.error) throw monthlyRes.error;
          if (yearlyRes.error) throw yearlyRes.error;
          if (totalRes.error) throw totalRes.error;
  
          dailyProfit = (dailyRes.data || []).reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0);
          monthlyProfit = (monthlyRes.data || []).reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0);
          yearlyProfit = (yearlyRes.data || []).reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0);
          totalProfit = (totalRes.data || []).reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0);
  
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