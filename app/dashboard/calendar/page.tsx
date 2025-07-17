"use client"

import { useState, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Edit,
  Trash2,
  X,
  Filter,
  Tag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  AppSidebar,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

// Helper to group trades by date (entry_time)
function groupTradesByDate(trades: any[]): Record<string, any[]> {
  return trades.reduce((acc: Record<string, any[]>, trade: any) => {
    const date = trade.entry_time?.split("T")[0];
    if (!date) return acc;
    if (!acc[date]) acc[date] = [];
    acc[date].push(trade);
    return acc;
  }, {});
}

// Get color based on P/L
const getPLColor = (pnl: number) => {
  if (pnl > 0) {
    if (pnl > 5000) return "bg-green-600 text-white"
    if (pnl > 2000) return "bg-green-500 text-white"
    return "bg-green-300 text-green-900"
  } else if (pnl < 0) {
    if (pnl < -3000) return "bg-red-600 text-white"
    if (pnl < -1000) return "bg-red-500 text-white"
    return "bg-red-300 text-red-900"
  }
  return "bg-gray-100 text-gray-600"
}

function MonthlyNavigation({ currentDate, onDateChange }: { currentDate: Date; onDateChange: (date: Date) => void }) {
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i) // 10 years before and after

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(year)
    onDateChange(newDate)
  }

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(month)
    onDateChange(newDate)
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => handleMonthChange(currentMonth - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Select value={String(currentYear)} onValueChange={(val) => handleYearChange(Number(val))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>{year}年</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(currentMonth)} onValueChange={(val) => handleMonthChange(Number(val))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, idx) => (
                <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => handleMonthChange(currentMonth + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-lg font-semibold text-green-600">月間損益: +¥128,750</div>
      {/* use this later */}
      {/* <div
          className={`text-lg font-semibold ${
            monthlyPL > 0
              ? "text-green-600"
              : monthlyPL < 0
              ? "text-red-600"
              : "text-gray-500"
          }`}
        >
          月間損益: {monthlyPL > 0 ? "+" : ""}¥{monthlyPL.toLocaleString()}
      </div> */}
    </div>
  )
}

function CalendarGrid({ currentDate, onDateClick, groupedTrades }: { currentDate: Date; onDateClick: (date: string) => void; groupedTrades: Record<string, any[]> }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const current = new Date(startDate);

  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  // Calculate daily P/L
  const getDailyPL = (date: string, groupedTrades: Record<string, any[]>): number => {
    const trades = groupedTrades[date] || [];
    return trades.reduce((sum: number, trade: any) => sum + (trade.profit_loss || 0), 0);
  };

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`p-3 text-center font-medium ${index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-700"}`}
          >
            {day}
          </div>
        ))}
      </div>
      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const isCurrentMonth = day.getMonth() === month;
          const dailyPL = getDailyPL(dateStr, groupedTrades);
          const tradeCount = (groupedTrades[dateStr] || []).length;
          const colorClass = isCurrentMonth && tradeCount > 0 ? getPLColor(dailyPL) : "";

          return (
            <div
              key={index}
              className={`min-h-[80px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors ${!isCurrentMonth ? "text-gray-400 bg-gray-50" : ""} ${colorClass}`}
              onClick={() => isCurrentMonth && onDateClick(dateStr)}
            >
              <div className="text-sm font-medium mb-1">{day.getDate()}</div>
              {isCurrentMonth && tradeCount > 0 && (
                <div className="text-xs space-y-1">
                  <div className={`font-medium ${dailyPL > 0 ? "text-green-800" : "text-red-800"}`}>
                    {dailyPL > 0 ? "+" : ""}¥{dailyPL.toLocaleString()}
                  </div>
                  <div className="text-gray-600">{tradeCount}件</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TradeCard({
  trade,
  onEdit,
  onDelete,
}: { trade: any; onEdit: (trade: any) => void; onDelete: (id: number) => void }) {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Badge variant={trade.status === "利確" ? "default" : "destructive"}>{trade.status}</Badge>
            <span className="font-medium">{trade.pair}</span>
            <span className="text-sm text-gray-500">{trade.time}</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(trade)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(trade.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div>エントリー: {trade.entry}</div>
          <div>エグジット: {trade.exit}</div>
        </div>

        <div className={`text-lg font-bold mb-2 ${trade.pnl > 0 ? "text-green-600" : "text-red-600"}`}>
          {trade.pnl > 0 ? "+" : ""}¥{trade.pnl.toLocaleString()}
        </div>

        <div className="flex flex-wrap gap-1">
          {trade.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RightSidebar({
  isOpen,
  onClose,
  selectedDate,
  trades,
  onEditTrade,
  onDeleteTrade,
  onAddTrade,
  onImportCSV,
  onDisplaySettings,
}: {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  trades: any[]
  onEditTrade: (trade: any) => void
  onDeleteTrade: (id: number) => void
  onAddTrade: () => void
  onImportCSV: () => void
  onDisplaySettings: () => void
}) {
  if (!isOpen) return null

  const dailyPL = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0)

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{selectedDate}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div
            className={`text-xl font-bold ${
              dailyPL > 0
                ? "text-green-600"
                : dailyPL < 0
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            日次損益: {dailyPL > 0 ? "+" : ""}¥{dailyPL.toLocaleString()}
          </div>


          <div className="text-sm text-gray-500">{trades.length}件の取引</div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b space-y-2">
          <div className="flex gap-2">
            <Button onClick={onAddTrade} className="flex-1">
              <Plus className="mr-2 h-4 w-4" />
              取引追加
            </Button>
            <Button variant="outline" onClick={onImportCSV}>
              <Upload className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
          <Button variant="outline" onClick={onDisplaySettings} className="w-full bg-transparent">
            <Filter className="mr-2 h-4 w-4" />
            表示設定
          </Button>
        </div>

        {/* Trade History */}
        <div className="p-4">
          <h4 className="font-medium mb-3">取引履歴</h4>
          {trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} onEdit={onEditTrade} onDelete={onDeleteTrade} />
          ))}
        </div>
      </div>
    </>
  )
}

function TradeEditDialog({
  trade,
  isOpen,
  onClose,
  onSave,
}: {
  trade: any
  isOpen: boolean
  onClose: () => void
  onSave: (trade: any) => void
}) {
  const [formData, setFormData] = useState(
    trade || {
      pair: "",
      type: "買い",
      entry: "",
      exit: "",
      pnl: "",
      status: "利確",
      time: "",
      tags: [],
    },
  )
  const [newTag, setNewTag] = useState("")

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((tag: string) => tag !== tagToRemove) })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{trade ? "取引編集" : "新規取引"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pair">通貨ペア</Label>
              <Input
                id="pair"
                value={formData.pair}
                onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type">取引種別</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="買い">買い</SelectItem>
                  <SelectItem value="売り">売り</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entry">エントリー価格</Label>
              <Input
                id="entry"
                type="number"
                step="0.01"
                value={formData.entry}
                onChange={(e) => setFormData({ ...formData, entry: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="exit">エグジット価格</Label>
              <Input
                id="exit"
                type="number"
                step="0.01"
                value={formData.exit}
                onChange={(e) => setFormData({ ...formData, exit: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pnl">損益</Label>
              <Input
                id="pnl"
                type="number"
                value={formData.pnl}
                onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="time">時間</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">ステータス</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="利確">利確</SelectItem>
                <SelectItem value="損切">損切</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>タグ</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="新しいタグ"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTag()}
              />
              <Button type="button" onClick={addTag}>
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={() => onSave(formData)}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CSVImportDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CSV インポート</DialogTitle>
          <DialogDescription>取引データをCSVファイルからインポートします</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="broker">ブローカー</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="ブローカーを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mt4">MetaTrader 4</SelectItem>
                <SelectItem value="mt5">MetaTrader 5</SelectItem>
                <SelectItem value="oanda">OANDA</SelectItem>
                <SelectItem value="custom">カスタム</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="csvFile">CSVファイル</Label>
            <Input id="csvFile" type="file" accept=".csv" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button>インポート</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DisplaySettingsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>表示設定</DialogTitle>
          <DialogDescription>取引履歴カードの表示項目を設定します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {[
            { id: "pair", label: "通貨ペア", checked: true },
            { id: "entry", label: "エントリー価格", checked: true },
            { id: "exit", label: "エグジット価格", checked: true },
            { id: "time", label: "取引時間", checked: true },
            { id: "tags", label: "タグ", checked: true },
            { id: "volume", label: "取引量", checked: false },
            { id: "commission", label: "手数料", checked: false },
          ].map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox id={item.id} defaultChecked={item.checked} />
              <Label htmlFor={item.id}>{item.label}</Label>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CalendarPage() {
  const user = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2024, 0, 1));
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  const [editingTrade, setEditingTrade] = useState<any>(null);
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState<boolean>(false);
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState<boolean>(false);
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState<boolean>(false);
  const [deleteTradeId, setDeleteTradeId] = useState<number | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setTrades([]);
        } else {
          setTrades(data || []);
        }
        setLoading(false);
      });
  }, [user]);

  const groupedTrades = groupTradesByDate(trades);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setIsRightSidebarOpen(true);
  };

  const handleEditTrade = (trade: any) => {
    setEditingTrade(trade);
    setIsTradeDialogOpen(true);
  };

  const handleAddTrade = () => {
    setEditingTrade(null);
    setIsTradeDialogOpen(true);
  };

  const handleSaveTrade = (trade: any) => {
    // Save trade logic here
    setIsTradeDialogOpen(false);
    setEditingTrade(null);
  };

  const handleDeleteTrade = (id: number) => {
    setDeleteTradeId(id);
  };

  const confirmDelete = () => {
    // Delete trade logic here
    setDeleteTradeId(null);
  };

  const selectedTrades = groupedTrades[selectedDate] || [];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">カレンダー</h1>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-10">{error}</div>
          ) : (
            <>
              <MonthlyNavigation currentDate={currentDate} onDateChange={setCurrentDate} />
              <CalendarGrid currentDate={currentDate} onDateClick={handleDateClick} groupedTrades={groupedTrades} />
            </>
          )}
        </main>
        <RightSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          selectedDate={selectedDate}
          trades={selectedTrades}
          onEditTrade={handleEditTrade}
          onDeleteTrade={handleDeleteTrade}
          onAddTrade={handleAddTrade}
          onImportCSV={() => setIsCSVDialogOpen(true)}
          onDisplaySettings={() => setIsDisplaySettingsOpen(true)}
        />
        <TradeEditDialog
          trade={editingTrade}
          isOpen={isTradeDialogOpen}
          onClose={() => setIsTradeDialogOpen(false)}
          onSave={handleSaveTrade}
        />
        <CSVImportDialog isOpen={isCSVDialogOpen} onClose={() => setIsCSVDialogOpen(false)} />
        <DisplaySettingsDialog isOpen={isDisplaySettingsOpen} onClose={() => setIsDisplaySettingsOpen(false)} />
        <AlertDialog open={deleteTradeId !== null} onOpenChange={() => setDeleteTradeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>取引を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消すことができません。取引データが完全に削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>削除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
