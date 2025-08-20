import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RecentActivity() {
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
        .order("entry_date", { ascending: false })
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
                        <TableCell className="text-sm">{formatDate(trade.entry_date)}</TableCell>
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