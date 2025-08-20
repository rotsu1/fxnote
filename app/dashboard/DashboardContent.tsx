"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Settings, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DashboardContentProps {
  featuresLocked: boolean;
  subscriptionState: 'never_subscribed' | 'active' | 'inactive';
  userId: string;
}

function PLSummaryCards({ featuresLocked }: { featuresLocked: boolean }) {
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
    if (!user || featuresLocked) return;
    
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
  }, [user, featuresLocked]);

  if (featuresLocked) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="opacity-50 blur-sm pointer-events-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
  );
}

function PerformanceMetrics({ featuresLocked }: { featuresLocked: boolean }) {
  if (featuresLocked) {
    return (
      <Card className="opacity-50 blur-sm pointer-events-none">
        <CardHeader>
          <CardTitle>パフォーマンス指標</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
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
        <div className="text-center text-muted-foreground py-10">
          プレミアム機能です。サブスクリプションで利用できます。
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity({ featuresLocked }: { featuresLocked: boolean }) {
  if (featuresLocked) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="opacity-50 blur-sm pointer-events-none">
          <CardHeader>
            <CardTitle>最近の取引履歴</CardTitle>
            <CardDescription>最新5件の取引</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-50 blur-sm pointer-events-none">
          <CardHeader>
            <CardTitle>最近のメモ</CardTitle>
            <CardDescription>最新3件のメモ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
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
          <div className="text-center text-muted-foreground py-10">
            プレミアム機能です。サブスクリプションで利用できます。
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近のメモ</CardTitle>
          <CardDescription>最新3件のメモ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">
            プレミアム機能です。サブスクリプションで利用できます。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardContent({ featuresLocked, subscriptionState, userId }: DashboardContentProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">ダッシュボード</h1>
            {featuresLocked && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                <Crown className="h-3 w-3 mr-1" />
                プレミアム機能
              </Badge>
            )}
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 md:px-6 pt-6">
          {/* P/L Summary Cards */}
          <section>
            <h2 className="text-xl font-semibold mb-4">損益サマリーカード</h2>
            <PLSummaryCards featuresLocked={featuresLocked} />
          </section>

          {/* Performance Metrics */}
          <section>
            <PerformanceMetrics featuresLocked={featuresLocked} />
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-xl font-semibold mb-4">最近の活動</h2>
            <RecentActivity featuresLocked={featuresLocked} />
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
