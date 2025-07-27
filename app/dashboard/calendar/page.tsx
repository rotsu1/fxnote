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
import { Textarea } from "@/components/ui/textarea"
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

// Sample trade data (expanded for table view)
interface Trade {
  id: number
  date: string
  time: string
  entryDateTime?: string
  exitDateTime?: string
  pair: string
  type: "買い" | "売り"
  entry: number
  exit: number
  lotSize?: number
  pips: number
  profit: number
  emotion: string
  holdingTime: number
  holdingDays?: number
  holdingHours?: number
  holdingMinutes?: number
  notes?: string
  tags: string[]
}

const availableTags = [
  "USD/JPY",
  "EUR/USD",
  "GBP/JPY",
  "AUD/USD",
  "スキャルピング",
  "デイトレード",
  "スイング",
  "ブレイクアウト",
  "レンジブレイク",
  "押し目買い",
  "逆張り",
  "トレンド",
  "レンジ",
  "興奮",
  "焦り",
  "冷静",
  "満足",
  "後悔",
  "朝",
  "昼",
  "夜",
  "失敗",
  "成功",
]

// Remove the hardcoded emotions array since we'll load from database

// Helper to convert UTC datetime to local datetime string for input
function utcToLocalDateTime(utcString: string): string {
  if (!utcString) return "";
  const date = new Date(utcString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Helper to convert local datetime string to UTC ISO string
function localDateTimeToUTC(localDateTimeString: string): string {
  if (!localDateTimeString) return new Date().toISOString();
  // Create a date object from the local datetime string
  const date = new Date(localDateTimeString);
  return date.toISOString();
}

// Helper to group trades by date (exit_time)
function groupTradesByDate(trades: any[]): Record<string, any[]> {
  return trades.reduce((acc: Record<string, any[]>, trade: any) => {
    const date = trade.exit_time?.split("T")[0];
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

function MonthlyNavigation({ currentDate, onDateChange, trades }: { currentDate: Date; onDateChange: (date: Date) => void; trades: any[] }) {
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i) // 10 years before and after

  // Calculate monthly P/L
  const monthlyPL = trades.reduce((sum, trade) => {
    const tradeDate = new Date(trade.exit_time || trade.entry_time || trade.created_at);
    if (tradeDate.getFullYear() === currentYear && tradeDate.getMonth() === currentMonth) {
      return sum + (trade.profit_loss || trade.pnl || 0);
    }
    return sum;
  }, 0);

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
      <div
        className={`text-lg font-semibold ${
          monthlyPL > 0
            ? "text-green-600"
            : monthlyPL < 0
            ? "text-red-600"
            : "text-gray-500"
        }`}
      >
        月間損益: {monthlyPL > 0 ? "+" : ""}¥{monthlyPL.toLocaleString()}
      </div>
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

function getJapaneseTradeType(type: string | number) {
  if (type === "buy" || type === 0) return "買い";
  if (type === "sell" || type === 1) return "売り";
  return type;
}

function TradeCard({
  trade,
  onEdit,
  onDelete,
}: { trade: any; onEdit: (trade: any) => void; onDelete: (id: number) => void }) {
  // Ensure pnl is a number
  const pnl = typeof trade.pnl === "number" ? trade.pnl : (typeof trade.profit_loss === "number" ? trade.profit_loss : 0);
  
  // Get symbol name from symbol ID
  const symbolName = trade.symbol_name || trade.pair || trade.currency_pair || "Unknown";
  
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Badge variant={trade.status === "利確" ? "default" : "destructive"}>{trade.status}</Badge>
            <span className="font-medium">{symbolName}</span>
            <span className="text-sm text-gray-500">{getJapaneseTradeType(trade.type || trade.trade_type)}</span>
            <span className="text-sm text-gray-500">{trade.exit_time?.split("T")[1]?.slice(0,5) || trade.entry_time?.split("T")[1]?.slice(0,5) || trade.time}</span>
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
          <div>エントリー: {trade.entry || trade.entry_price}</div>
          <div>エグジット: {trade.exit || trade.exit_price}</div>
        </div>

        <div className={`text-lg font-bold mb-2 ${pnl > 0 ? "text-green-600" : "text-red-600"}`}>
          {pnl > 0 ? "+" : ""}¥{Number(pnl).toLocaleString()}
        </div>

        <div className="flex flex-wrap gap-1">
          {(trade.tags || (trade.trade_memo ? [trade.trade_memo] : [])).map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
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

// Reusing TradeEditDialog from calendar page, slightly modified for new fields
function TradeEditDialog({
  trade,
  isOpen,
  onClose,
  onSave,
  defaultDate,
  user,
}: {
  trade: Partial<Trade> | null
  isOpen: boolean
  onClose: () => void
  onSave: (trade: Partial<Trade>) => void
  defaultDate?: string
  user: any
}) {
    const [formData, setFormData] = useState<Partial<Trade>>(
    trade || {
      date: defaultDate || new Date().toISOString().split("T")[0],
      time: "",
      entryDateTime: "",
      exitDateTime: "",
    pair: "",
      type: "買い",
      entry: undefined,
      exit: undefined,
      lotSize: undefined,
      pips: undefined,
      profit: undefined,
      emotion: "",
      holdingTime: 0,
      holdingDays: undefined,
      holdingHours: undefined,
      holdingMinutes: undefined,
      notes: "",
      tags: [],
    },
  )
  const [newTag, setNewTag] = useState("")
  const [isTagEditOpen, setIsTagEditOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [tagError, setTagError] = useState("")
  const [isEmotionEditOpen, setIsEmotionEditOpen] = useState(false)
  const [availableEmotions, setAvailableEmotions] = useState<string[]>([])
  const [loadingEmotions, setLoadingEmotions] = useState(false)
  const [newEmotion, setNewEmotion] = useState("")
  const [emotionError, setEmotionError] = useState("")
  const [emotionToDelete, setEmotionToDelete] = useState<string | null>(null)
  const [validationError, setValidationError] = useState("")

    useEffect(() => {
    setFormData(
      trade || {
        date: defaultDate || new Date().toISOString().split("T")[0],
    time: "",
        entryDateTime: "",
        exitDateTime: "",
        pair: "",
        type: "買い",
        entry: undefined,
        exit: undefined,
        lotSize: undefined,
        pips: undefined,
        profit: undefined,
        emotion: "",
        holdingTime: 0,
        holdingDays: undefined,
        holdingHours: undefined,
        holdingMinutes: undefined,
        notes: "",
        tags: [],
      },
    )
  }, [trade, defaultDate])

  // Load tags from database
  const loadTagsFromDatabase = async () => {
    if (!user) return
    
    setLoadingTags(true)
    try {
      const { data, error } = await supabase
        .from("trade_tags")
        .select("tag_name")
        .eq("user_id", user.id)
        .order("tag_name")
      
      if (error) {
        console.error("Error loading tags:", error)
        return
      }
      
      const tags = data?.map(item => item.tag_name) || []
      setAvailableTags(tags)
    } catch (error) {
      console.error("Error loading tags:", error)
    } finally {
      setLoadingTags(false)
    }
  }

  useEffect(() => {
    loadTagsFromDatabase()
  }, [user])

  // Load emotions from database
  const loadEmotionsFromDatabase = async () => {
    if (!user) return
    
    setLoadingEmotions(true)
    try {
      const { data, error } = await supabase
        .from("emotions")
        .select("emotion")
        .eq("user_id", user.id)
        .order("emotion")
      
      if (error) {
        console.error("Error loading emotions:", error)
        return
      }
      
      const emotions = data?.map(item => item.emotion) || []
      setAvailableEmotions(emotions)
    } catch (error) {
      console.error("Error loading emotions:", error)
    } finally {
      setLoadingEmotions(false)
    }
  }

  useEffect(() => {
    loadEmotionsFromDatabase()
  }, [user])

  // Auto-calculate holding time when entry and exit datetimes change
  useEffect(() => {
    if (formData.entryDateTime && formData.exitDateTime) {
      const entryDate = new Date(formData.entryDateTime);
      const exitDate = new Date(formData.exitDateTime);
      
      const diffMs = exitDate.getTime() - entryDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setFormData(prev => ({
        ...prev,
        holdingDays: diffDays,
        holdingHours: diffHours,
        holdingMinutes: diffMinutes
      }));
    }
  }, [formData.entryDateTime, formData.exitDateTime])

  const addTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), newTag] })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: (formData.tags || []).filter((tag: string) => tag !== tagToRemove) })
  }

  const addExistingTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tag] })
    }
  }

  const toggleTag = (tag: string) => {
    const currentTags = formData.tags || []
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) })
    } else {
      setFormData({ ...formData, tags: [...currentTags, tag] })
    }
  }

  const addNewTagToDatabase = async (tagName: string) => {
    if (!tagName.trim() || !user) return
    
    const trimmedTagName = tagName.trim()
    
    // Check if tag already exists
    if (availableTags.includes(trimmedTagName)) {
      setTagError("このタグ名は既に存在します")
      return
    }
    
    // Clear any previous errors
    setTagError("")
    
    try {
      // Add to database first
      const { error } = await supabase
        .from("trade_tags")
        .insert([{
          user_id: user.id,
          tag_name: trimmedTagName
        }])
      
      if (error) {
        console.error("Error adding tag to database:", error)
        setTagError("タグの追加に失敗しました")
        return
      }
      
      // Add to local state
      setAvailableTags(prev => [...prev, trimmedTagName])
      setNewTag("")
      
      console.log(`Added new tag to database: ${trimmedTagName}`)
    } catch (error) {
      console.error("Error adding tag to database:", error)
      setTagError("タグの追加に失敗しました")
    }
  }

  const confirmDeleteTag = (tagName: string) => {
    setTagToDelete(tagName)
  }

  const deleteTagFromDatabase = async () => {
    if (!tagToDelete || !user) return
    
    try {
      // Delete from database first
      const { error } = await supabase
        .from("trade_tags")
        .delete()
        .eq("user_id", user.id)
        .eq("tag_name", tagToDelete)
      
      if (error) {
        console.error("Error deleting tag from database:", error)
        return
      }
      
      // Remove from local state
      setAvailableTags(prev => prev.filter(tag => tag !== tagToDelete))
      
      console.log(`Deleted tag from database: ${tagToDelete}`)
      setTagToDelete(null)
    } catch (error) {
      console.error("Error deleting tag from database:", error)
    }
  }

  const handleNewTagChange = (value: string) => {
    setNewTag(value)
    // Clear error when user starts typing
    if (tagError) {
      setTagError("")
    }
  }

  const addNewEmotionToDatabase = async (emotionName: string) => {
    if (!emotionName.trim() || !user) return
    
    const trimmedEmotionName = emotionName.trim()
    
    // Check if emotion already exists
    if (availableEmotions.includes(trimmedEmotionName)) {
      setEmotionError("この感情名は既に存在します")
      return
    }
    
    // Clear any previous errors
    setEmotionError("")
    
    try {
      // Add to database first
      const { error } = await supabase
        .from("emotions")
        .insert([{
          user_id: user.id,
          emotion: trimmedEmotionName
        }])
      
      if (error) {
        console.error("Error adding emotion to database:", error)
        setEmotionError("感情の追加に失敗しました")
        return
      }
      
      // Add to local state
      setAvailableEmotions(prev => [...prev, trimmedEmotionName])
      setNewEmotion("")
      
      console.log(`Added new emotion to database: ${trimmedEmotionName}`)
    } catch (error) {
      console.error("Error adding emotion to database:", error)
      setEmotionError("感情の追加に失敗しました")
    }
  }

  const confirmDeleteEmotion = (emotionName: string) => {
    setEmotionToDelete(emotionName)
  }

  const deleteEmotionFromDatabase = async () => {
    if (!emotionToDelete || !user) return
    
    try {
      // Delete from database first
      const { error } = await supabase
        .from("emotions")
        .delete()
        .eq("user_id", user.id)
        .eq("emotion", emotionToDelete)
      
      if (error) {
        console.error("Error deleting emotion from database:", error)
        return
      }
      
      // Remove from local state
      setAvailableEmotions(prev => prev.filter(emotion => emotion !== emotionToDelete))
      
      console.log(`Deleted emotion from database: ${emotionToDelete}`)
      setEmotionToDelete(null)
    } catch (error) {
      console.error("Error deleting emotion from database:", error)
    }
  }

  const handleNewEmotionChange = (value: string) => {
    setNewEmotion(value)
    // Clear error when user starts typing
    if (emotionError) {
      setEmotionError("")
    }
  }

  const handleSave = () => {
    // Clear previous validation errors
    setValidationError("")
    
    // Validation: Check if required fields are filled
    if (!formData.pair || !formData.pair.trim()) {
      setValidationError("通貨ペアを入力してください")
      return
    }
    
    if (formData.profit === undefined || formData.profit === null) {
      setValidationError("損益を入力してください")
      return
    }
    
    // Basic validation for numbers
    const parsedEntry = formData.entry !== undefined ? Number.parseFloat(String(formData.entry)) : undefined
    const parsedExit = formData.exit !== undefined ? Number.parseFloat(String(formData.exit)) : undefined
    const parsedLotSize = formData.lotSize !== undefined ? Number.parseFloat(String(formData.lotSize)) : undefined
    const parsedPips = formData.pips !== undefined ? Number.parseFloat(String(formData.pips)) : undefined
    const parsedProfit = formData.profit !== undefined ? Number.parseFloat(String(formData.profit)) : undefined

    // Calculate holding time in seconds
    const holdingTimeInSeconds = (formData.holdingDays || 0) * 24 * 60 * 60 + 
                                (formData.holdingHours || 0) * 60 * 60 + 
                                (formData.holdingMinutes || 0) * 60

    onSave({
      ...formData,
      entry: parsedEntry,
      exit: parsedExit,
      lotSize: parsedLotSize,
      pips: parsedPips,
      profit: parsedProfit,
      holdingTime: holdingTimeInSeconds,
    })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{trade?.id ? "取引編集" : "新規取引"}</DialogTitle>
            <DialogDescription>取引の詳細を入力または編集してください。</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entryDateTime">エントリー日時</Label>
                <Input
                  id="entryDateTime"
                  type="datetime-local"
                  value={formData.entryDateTime}
                  onChange={(e) => setFormData({ ...formData, entryDateTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="exitDateTime">エグジット日時</Label>
                <Input
                  id="exitDateTime"
                  type="datetime-local"
                  value={formData.exitDateTime}
                  onChange={(e) => setFormData({ ...formData, exitDateTime: e.target.value })}
                />
              </div>
            </div>

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
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as "買い" | "売り" })}
                >
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
                  step="0.0001"
                value={formData.entry}
                  onChange={(e) => setFormData({ ...formData, entry: Number.parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="exit">エグジット価格</Label>
              <Input
                id="exit"
                type="number"
                  step="0.0001"
                value={formData.exit}
                  onChange={(e) => setFormData({ ...formData, exit: Number.parseFloat(e.target.value) })}
              />
            </div>
          </div>

                    <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lotSize">ロットサイズ</Label>
              <Input
                id="lotSize"
                type="number"
                step="0.01"
                value={formData.lotSize}
                onChange={(e) => setFormData({ ...formData, lotSize: Number.parseFloat(e.target.value) })}
                placeholder="0.01"
              />
            </div>
            <div>
              <Label htmlFor="pips">pips</Label>
              <Input
                id="pips"
                type="number"
                step="0.1"
                value={formData.pips}
                onChange={(e) => setFormData({ ...formData, pips: Number.parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="profit">損益 (¥)</Label>
              <Input
                  id="profit"
                  type="number"
                  value={formData.profit}
                  onChange={(e) => setFormData({ ...formData, profit: Number.parseFloat(e.target.value) })}
              />
            </div>
          </div>
          
          {validationError && (
            <div className="text-red-600 text-sm mt-1">{validationError}</div>
          )}

                      <div>
            <div className="flex items-center justify-between mb-2">
              <Label>感情</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setIsEmotionEditOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                編集
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 min-h-[32px] p-2 border rounded">
              {loadingEmotions ? (
                <span className="text-sm text-muted-foreground">感情を読み込み中...</span>
              ) : availableEmotions.length > 0 ? (
                availableEmotions.map((emotion, index) => (
                  <Badge
                    key={index}
                    variant={formData.emotion === emotion ? "default" : "outline"}
                    className={`cursor-pointer text-xs ${
                      formData.emotion === emotion ? "bg-black text-white hover:bg-black/90" : ""
                    }`}
                    onClick={() => {
                      if (formData.emotion === emotion) {
                        // If already selected, unselect it
                        setFormData({ ...formData, emotion: "" })
                      } else {
                        // If not selected, select it
                        setFormData({ ...formData, emotion: emotion })
                      }
                    }}
                  >
                    {emotion}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">感情がありません</span>
              )}
            </div>
          </div>

                      <div>
            <Label>保有時間</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="holdingDays" className="text-sm text-muted-foreground">日</Label>
                <Input
                  id="holdingDays"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.holdingDays || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    holdingDays: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="holdingHours" className="text-sm text-muted-foreground">時間</Label>
                <Input
                  id="holdingHours"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.holdingHours || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    holdingHours: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="holdingMinutes" className="text-sm text-muted-foreground">分</Label>
                <Input
                  id="holdingMinutes"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.holdingMinutes || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    holdingMinutes: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

            <div>
              <Label htmlFor="notes">メモ</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="取引に関するメモ"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>タグ</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsTagEditOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  編集
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 min-h-[32px] p-2 border rounded">
                {loadingTags ? (
                  <span className="text-sm text-muted-foreground">タグを読み込み中...</span>
                ) : availableTags.length > 0 ? (
                  availableTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant={formData.tags?.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer text-xs ${
                        formData.tags?.includes(tag) ? "bg-black text-white hover:bg-black/90" : ""
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">タグがありません</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>

            {/* Tag Edit Dialog */}
      <Dialog open={isTagEditOpen} onOpenChange={setIsTagEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>タグ管理</DialogTitle>
            <DialogDescription>データベースのタグを追加または削除してください。</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add new tag */}
            <div>
              <Label htmlFor="newTagInput">新しいタグを追加</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="newTagInput"
                  placeholder="新しいタグ名を入力"
                  value={newTag}
                  onChange={(e) => handleNewTagChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addNewTagToDatabase(newTag)}
                />
                <Button type="button" onClick={() => addNewTagToDatabase(newTag)} size="sm">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              {tagError && (
                <p className="text-red-600 text-sm mt-1">{tagError}</p>
              )}
            </div>

            {/* All available tags with delete option */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">利用可能なタグ:</Label>
              <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto border rounded p-2">
                {availableTags.length > 0 ? (
                  availableTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-red-50 hover:border-red-300"
                      onClick={() => confirmDeleteTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">タグがありません</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                タグをクリックして削除
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsTagEditOpen(false)}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emotion Edit Dialog */}
      <Dialog open={isEmotionEditOpen} onOpenChange={setIsEmotionEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>感情管理</DialogTitle>
            <DialogDescription>感情を選択、追加、または削除してください。</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add new emotion */}
            <div>
              <Label htmlFor="newEmotionInput">新しい感情を追加</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="newEmotionInput"
                  placeholder="新しい感情名を入力"
                  value={newEmotion}
                  onChange={(e) => handleNewEmotionChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addNewEmotionToDatabase(newEmotion)}
                />
                <Button type="button" onClick={() => addNewEmotionToDatabase(newEmotion)} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {emotionError && (
                <p className="text-red-600 text-sm mt-1">{emotionError}</p>
              )}
            </div>

            {/* Available emotions */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">利用可能な感情:</Label>
              <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto border rounded p-2">
                {loadingEmotions ? (
                  <span className="text-sm text-muted-foreground">感情を読み込み中...</span>
                ) : availableEmotions.length > 0 ? (
                  availableEmotions.map((emotion, index) => (
                    <Badge
                      key={index}
                      variant={formData.emotion === emotion ? "default" : "outline"}
                      className={`cursor-pointer text-xs ${
                        formData.emotion === emotion ? "bg-black text-white hover:bg-black/90" : "hover:bg-red-50 hover:border-red-300"
                      }`}
                      onClick={() => {
                        if (formData.emotion === emotion) {
                          // If already selected, allow deletion
                          confirmDeleteEmotion(emotion)
                        } else {
                          // If not selected, select it
                          setFormData({ ...formData, emotion: emotion })
                          setIsEmotionEditOpen(false)
                        }
                      }}
                    >
                      {emotion} {formData.emotion === emotion ? "" : "×"}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">感情がありません</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                選択済みの感情をクリックして削除、未選択の感情をクリックして選択
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEmotionEditOpen(false)}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tag Delete Warning Dialog */}
      <AlertDialog open={tagToDelete !== null} onOpenChange={() => setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タグを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                <strong>「{tagToDelete}」</strong> タグを削除しようとしています。
              </p>
              <p className="text-red-600">
                ⚠️ このタグは、このタグを使用しているすべての取引から削除されます。
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                この操作は取り消すことができません。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteTagFromDatabase}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Emotion Delete Warning Dialog */}
      <AlertDialog open={emotionToDelete !== null} onOpenChange={() => setEmotionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>感情を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                <strong>「{emotionToDelete}」</strong> 感情を削除しようとしています。
              </p>
              <p className="text-red-600">
                ⚠️ この感情は、この感情を使用しているすべての取引から削除されます。
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                この操作は取り消すことができません。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteEmotionFromDatabase}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
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
  const [isEditingLoading, setIsEditingLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    supabase
      .from("trades")
      .select(`
        *,
        symbols!inner(symbol)
      `)
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setTrades([]);
        } else {
          // Transform data to include symbol_name
          const transformedData = data?.map(trade => ({
            ...trade,
            symbol_name: trade.symbols?.symbol
          })) || [];
          setTrades(transformedData);
        }
        setLoading(false);
      });
  }, [user]);

  const groupedTrades = groupTradesByDate(trades);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setIsRightSidebarOpen(true);
  };

  const handleEditTrade = async (trade: any) => {
    setIsEditingLoading(true);
    try {
      // Load trade tags
      let tradeTags: string[] = [];
      let tradeEmotion: string = "";
      
      if (trade.id) {
        // Load tags
        const { data: tagLinks, error: tagError } = await supabase
          .from("trade_tag_links")
          .select(`
            trade_tags!inner(tag_name)
          `)
          .eq("trade_id", trade.id);
        
        if (tagError) {
          console.error("Error loading trade tags:", tagError);
        } else {
          tradeTags = tagLinks?.map(link => (link.trade_tags as any)?.tag_name).filter(Boolean) || [];
          console.log("Loaded trade tags:", tradeTags);
        }
        
        // Load emotion
        const { data: emotionLink, error: emotionError } = await supabase
          .from("trade_emotion_links")
          .select(`
            emotions!inner(emotion)
          `)
          .eq("trade_id", trade.id)
          .single();
        
        if (emotionError && emotionError.code !== 'PGRST116') {
          console.error("Error loading trade emotion:", emotionError);
        } else if (emotionLink) {
          tradeEmotion = (emotionLink.emotions as any)?.emotion || "";
          console.log("Loaded trade emotion:", tradeEmotion);
        }
      }

      // Transform database trade data to form format
      const transformedTrade = {
        id: trade.id,
        date: trade.entry_time?.split("T")[0] || "",
        time: trade.entry_time?.split("T")[1]?.slice(0, 5) || "",
              entryDateTime: utcToLocalDateTime(trade.entry_time),
      exitDateTime: utcToLocalDateTime(trade.exit_time),
        pair: trade.symbol_name || "", // Use symbol name for display
        type: trade.trade_type === 0 ? "買い" : "売り",
        entry: trade.entry_price,
        exit: trade.exit_price,
        lotSize: trade.lot_size,
        pips: trade.pips,
        profit: trade.profit_loss,
        emotion: tradeEmotion,
        holdingTime: trade.hold_time || 0,
        holdingDays: trade.hold_time ? Math.floor(trade.hold_time / (24 * 60 * 60)) : 0,
        holdingHours: trade.hold_time ? Math.floor((trade.hold_time % (24 * 60 * 60)) / (60 * 60)) : 0,
        holdingMinutes: trade.hold_time ? Math.floor((trade.hold_time % (60 * 60)) / 60) : 0,
        notes: trade.trade_memo || "",
        tags: tradeTags,
      };
      
      console.log("Transformed trade for editing:", transformedTrade);
      setEditingTrade(transformedTrade);
      setIsTradeDialogOpen(true);
    } catch (error) {
      console.error("Error preparing trade for editing:", error);
      setError("取引の編集準備中にエラーが発生しました");
    } finally {
      setIsEditingLoading(false);
    }
  };

  const handleAddTrade = () => {
    setEditingTrade(null);
    setIsTradeDialogOpen(true);
  };

  const handleSaveTrade = async (tradeData: Partial<Trade>) => {
    if (!user) return;
    
    console.log("Saving trade data:", tradeData);
    console.log("User ID:", user.id);
    
    // Validate required fields
    if (!tradeData.pair || !tradeData.pair.trim()) {
      setError("通貨ペアは必須です");
      return;
    }
    
    if (tradeData.profit === undefined || tradeData.profit === null) {
      setError("損益は必須です");
      return;
    }
    
    try {
      if (editingTrade?.id) {
        // Update existing trade
        // Get or create symbol ID from symbols table
        let symbolId = null;
        if (tradeData.pair) {
          // First try to find existing symbol
          let { data: symbolData, error: symbolError } = await supabase
            .from("symbols")
            .select("id")
            .eq("symbol", tradeData.pair)
            .single();
          
          if (symbolError && symbolError.code === 'PGRST116') {
            // Symbol doesn't exist, create it
            console.log("Symbol not found, creating new symbol:", tradeData.pair);
            const { data: newSymbol, error: createError } = await supabase
              .from("symbols")
              .insert([{ symbol: tradeData.pair }])
              .select()
              .single();
            
            if (createError) {
              console.error("Error creating symbol:", createError);
            } else {
              symbolId = newSymbol?.id;
              console.log("Created new symbol ID:", symbolId, "for symbol:", tradeData.pair);
            }
          } else if (symbolError) {
            console.error("Error fetching symbol:", symbolError);
          } else {
            symbolId = symbolData?.id;
            console.log("Found symbol ID:", symbolId, "for symbol:", tradeData.pair);
          }
        }

        const updateData = {
          symbol: symbolId,
          trade_type: tradeData.type === "買い" ? 0 : 1,
          entry_price: tradeData.entry,
          exit_price: tradeData.exit,
          lot_size: tradeData.lotSize,
          pips: tradeData.pips,
          profit_loss: tradeData.profit,
          hold_time: tradeData.holdingTime,
          trade_memo: tradeData.notes,
          entry_time: localDateTimeToUTC(tradeData.entryDateTime || ""),
          exit_time: localDateTimeToUTC(tradeData.exitDateTime || ""),
          updated_at: new Date().toISOString(),
        };
        
        console.log("Updating trade with data:", updateData);
        
        const { error } = await supabase
          .from("trades")
          .update(updateData)
          .eq("id", editingTrade.id)
          .eq("user_id", user.id);
        
        if (error) {
          console.error("Error updating trade:", error);
          throw error;
        }
        
        // Handle tag relationships
        console.log("Processing tags:", tradeData.tags);
        
        // Always delete existing tag links first
        const { error: deleteError } = await supabase
          .from("trade_tag_links")
          .delete()
          .eq("trade_id", editingTrade.id);
        
        if (deleteError) {
          console.error("Error deleting existing tag links:", deleteError);
        }
        
        // Only insert new tag links if there are tags selected
        if (tradeData.tags && tradeData.tags.length > 0) {
          // Get tag IDs for the selected tags
          const { data: tagData, error: tagError } = await supabase
            .from("trade_tags")
            .select("id")
            .eq("user_id", user.id)
            .in("tag_name", tradeData.tags);
          
          if (tagError) {
            console.error("Error fetching tags:", tagError);
          }
          
          console.log("Found tag data:", tagData);
          
          if (tagData && tagData.length > 0) {
            // Insert new tag links
            const tagLinks = tagData.map(tag => ({
              trade_id: editingTrade.id,
              tag_id: tag.id
            }));
            
            console.log("Inserting tag links:", tagLinks);
            
            const { error: insertError } = await supabase
              .from("trade_tag_links")
              .insert(tagLinks);
            
            if (insertError) {
              console.error("Error inserting tag links:", insertError);
            }
          }
        }
        
                // Handle emotion relationship
        console.log("Processing emotion:", tradeData.emotion);
        
        // Always delete existing emotion link first
        const { error: deleteEmotionError } = await supabase
          .from("trade_emotion_links")
          .delete()
          .eq("trade_id", editingTrade.id);
        
        if (deleteEmotionError) {
          console.error("Error deleting existing emotion link:", deleteEmotionError);
        }
        
        // Only insert new emotion link if there is an emotion selected
        if (tradeData.emotion) {
          // Get emotion ID
          console.log("Fetching emotion with criteria:", {
            user_id: user.id,
            emotion: tradeData.emotion
          });
          
          const { data: emotionData, error: emotionError } = await supabase
            .from("emotions")
            .select("id")
            .eq("user_id", user.id)
            .eq("emotion", tradeData.emotion)
            .single();
          
          if (emotionError) {
            console.error("Error fetching emotion:", emotionError);
          }
          
          console.log("Found emotion data:", emotionData);
          
          if (emotionData) {
            // Insert new emotion link
            const emotionLinkData = {
              trade_id: editingTrade.id,
              emotion_id: emotionData.id
            };
            
            console.log("Attempting to insert emotion link:", emotionLinkData);
            
            const { error: insertError } = await supabase
              .from("trade_emotion_links")
              .insert(emotionLinkData);
            
            if (insertError) {
              console.error("Error inserting emotion link:", insertError);
              console.error("Emotion link data:", emotionLinkData);
            }
          }
        }
        
        // Refresh trades data
        const { data } = await supabase
          .from("trades")
          .select(`
            *,
            symbols!inner(symbol)
          `)
          .eq("user_id", user.id);
        
        if (data) {
          // Transform data to include symbol_name
          const transformedData = data.map(trade => ({
            ...trade,
            symbol_name: trade.symbols?.symbol
          }));
          setTrades(transformedData);
        }
      } else {
        // Add new trade
        // Get or create symbol ID from symbols table
        let symbolId = null;
        if (tradeData.pair) {
          // First try to find existing symbol
          let { data: symbolData, error: symbolError } = await supabase
            .from("symbols")
            .select("id")
            .eq("symbol", tradeData.pair)
            .single();
          
          if (symbolError && symbolError.code === 'PGRST116') {
            // Symbol doesn't exist, create it
            console.log("Symbol not found, creating new symbol:", tradeData.pair);
            const { data: newSymbol, error: createError } = await supabase
              .from("symbols")
              .insert([{ symbol: tradeData.pair }])
              .select()
              .single();
            
            if (createError) {
              console.error("Error creating symbol:", createError);
            } else {
              symbolId = newSymbol?.id;
              console.log("Created new symbol ID:", symbolId, "for symbol:", tradeData.pair);
            }
          } else if (symbolError) {
            console.error("Error fetching symbol:", symbolError);
          } else {
            symbolId = symbolData?.id;
            console.log("Found symbol ID:", symbolId, "for symbol:", tradeData.pair);
          }
        }

        const insertData = {
          user_id: user.id,
          symbol: symbolId,
          trade_type: tradeData.type === "買い" ? 0 : 1,
          entry_price: tradeData.entry,
          exit_price: tradeData.exit,
          lot_size: tradeData.lotSize,
          pips: tradeData.pips,
          profit_loss: tradeData.profit,
          hold_time: tradeData.holdingTime,
          trade_memo: tradeData.notes,
          entry_time: localDateTimeToUTC(tradeData.entryDateTime || ""),
          exit_time: localDateTimeToUTC(tradeData.exitDateTime || ""),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        console.log("Inserting new trade with data:", insertData);
        
        const { data: newTrade, error } = await supabase
          .from("trades")
          .insert([insertData])
          .select()
          .single();
        
        if (error) {
          console.error("Error inserting trade:", error);
          throw error;
        }
        
        if (newTrade) {
          console.log("New trade created:", newTrade);
          
          // Handle tag relationships
          if (tradeData.tags && tradeData.tags.length > 0) {
            console.log("Processing tags for new trade:", tradeData.tags);
            // Get tag IDs for the selected tags
            const { data: tagData, error: tagError } = await supabase
              .from("trade_tags")
              .select("id")
              .eq("user_id", user.id)
              .in("tag_name", tradeData.tags);
            
            if (tagError) {
              console.error("Error fetching tags for new trade:", tagError);
            }
            
            console.log("Found tag data for new trade:", tagData);
            
            if (tagData && tagData.length > 0) {
              // Insert tag links
              const tagLinks = tagData.map(tag => ({
                trade_id: newTrade.id,
                tag_id: tag.id
              }));
              
              console.log("Inserting tag links for new trade:", tagLinks);
              
              const { error: insertError } = await supabase
                .from("trade_tag_links")
                .insert(tagLinks);
              
              if (insertError) {
                console.error("Error inserting tag links for new trade:", insertError);
              }
            }
          }
          
          // Handle emotion relationship
          if (tradeData.emotion) {
            console.log("Processing emotion for new trade:", tradeData.emotion);
            // Get emotion ID
            console.log("Fetching emotion with criteria:", {
              user_id: user.id,
              emotion: tradeData.emotion
            });
            
            const { data: emotionData, error: emotionError } = await supabase
              .from("emotions")
              .select("id")
              .eq("user_id", user.id)
              .eq("emotion", tradeData.emotion)
              .single();
            
            if (emotionError) {
              console.error("Error fetching emotion for new trade:", emotionError);
            }
            
            console.log("Found emotion data for new trade:", emotionData);
            console.log("Emotion ID:", emotionData?.id);
            console.log("Trade ID:", newTrade?.id);
            
            if (emotionData) {
              // Insert emotion link
              const emotionLinkData = {
                trade_id: newTrade.id,
                emotion_id: emotionData.id
              };
              
              console.log("Attempting to insert emotion link:", emotionLinkData);
              
              const { error: insertError } = await supabase
                .from("trade_emotion_links")
                .insert(emotionLinkData);
              
              if (insertError) {
                console.error("Error inserting emotion link for new trade:", insertError);
                console.error("Emotion link data:", {
                  trade_id: newTrade.id,
                  emotion_id: emotionData.id
                });
              }
            }
          }
        }
        
        // Refresh trades data
        const { data: refreshedData } = await supabase
          .from("trades")
          .select(`
            *,
            symbols!inner(symbol)
          `)
          .eq("user_id", user.id);
        
        if (refreshedData) {
          // Transform data to include symbol_name
          const transformedData = refreshedData.map(trade => ({
            ...trade,
            symbol_name: trade.symbols?.symbol
          }));
          setTrades(transformedData);
        }
      }
      setIsTradeDialogOpen(false);
      setEditingTrade(null);
    } catch (error: any) {
      console.error("Error saving trade:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      setError(error.message || "取引の保存中にエラーが発生しました");
    }
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
              <MonthlyNavigation currentDate={currentDate} onDateChange={setCurrentDate} trades={trades} />
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
          defaultDate={selectedDate}
          user={user}
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
