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
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
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
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Helper to convert local datetime string to UTC ISO string
function localDateTimeToUTC(localDateTimeString: string): string {
  if (!localDateTimeString || localDateTimeString.trim() === "") {
    console.log("localDateTimeToUTC: Empty input, using current time");
    return new Date().toISOString();
  }
  
  console.log("localDateTimeToUTC: Input:", localDateTimeString);
  
  // Create a date object from the local datetime string
  const date = new Date(localDateTimeString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error("localDateTimeToUTC: Invalid date string:", localDateTimeString);
    return new Date().toISOString();
  }
  
  const result = date.toISOString();
  console.log("localDateTimeToUTC: Output:", result);
  return result;
}

// Helper to format hold time from seconds to readable format
function formatHoldTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0分";
  
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  let result = "";
  if (days > 0) result += `${days}日`;
  if (hours > 0) result += `${hours}時間`;
  if (minutes > 0) result += `${minutes}分`;
  if (remainingSeconds > 0) result += `${remainingSeconds}秒`;
  
  return result || "0分";
}

// Helper to group trades by date (exit_time) with proper timezone handling
function groupTradesByDate(trades: any[]): Record<string, any[]> {
  return trades.reduce((acc: Record<string, any[]>, trade: any) => {
    if (!trade.exit_time) return acc;
    
    // Convert UTC timestamp to local date
    const exitDate = new Date(trade.exit_time);
    const localDate = exitDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
    
    if (!acc[localDate]) acc[localDate] = [];
    acc[localDate].push(trade);
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

function MonthlyNavigation({ currentDate, onDateChange, trades, onImportCSV }: { currentDate: Date; onDateChange: (date: Date) => void; trades: any[]; onImportCSV: () => void }) {
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i) // 10 years before and after

  // Calculate monthly P/L with proper timezone handling
  const monthlyPL = trades.reduce((sum, trade) => {
    const tradeDate = new Date(trade.exit_time || trade.entry_time || trade.created_at);
    // Use local date for comparison
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
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onImportCSV}>
          <Upload className="mr-2 h-4 w-4" />
          CSV
        </Button>
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
    </div>
  )
}

function CalendarGrid({ currentDate, onDateClick, groupedTrades }: { currentDate: Date; onDateClick: (date: string) => void; groupedTrades: Record<string, any[]> }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
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
  displaySettings,
}: { 
  trade: any; 
  onEdit: (trade: any) => void; 
  onDelete: (id: number) => void;
  displaySettings: Record<string, boolean>;
}) {
  const [tradeTags, setTradeTags] = useState<string[]>([]);
  const [tradeEmotion, setTradeEmotion] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);

  // Ensure pnl is a number
  const pnl = typeof trade.pnl === "number" ? trade.pnl : (typeof trade.profit_loss === "number" ? trade.profit_loss : 0);
  
  // Get symbol name from symbol ID
  const symbolName = trade.symbol_name || trade.pair || trade.currency_pair || "Unknown";
  
  // Get long/short text
  const getLongShortText = (type: string | number) => {
    if (type === "買い" || type === 0) return "ロング";
    if (type === "売り" || type === 1) return "ショート";
    return type;
  };

  // Load trade tags and emotion
  useEffect(() => {
    const loadTradeData = async () => {
      if (!trade.id) {
        setLoadingData(false);
        return;
      }

      try {
        // Load tags
        const { data: tagLinks, error: tagError } = await supabase
          .from("trade_tag_links")
          .select(`
            tag_id,
            trade_tags(tag_name)
          `)
          .eq("trade_id", trade.id);

        if (tagError) {
          console.error("Error loading trade tags:", tagError);
        } else {
          const tags = tagLinks?.map(link => (link.trade_tags as any)?.tag_name).filter(Boolean) || [];
          setTradeTags(tags);
        }

        // Load emotion
        const { data: emotionLinks, error: emotionError } = await supabase
          .from("trade_emotion_links")
          .select(`
            emotion_id,
            emotions(emotion)
          `)
          .eq("trade_id", trade.id);

        if (emotionError) {
          console.error("Error loading trade emotion:", emotionError);
        } else if (emotionLinks && emotionLinks.length > 0) {
          const emotionLink = emotionLinks[0];
          setTradeEmotion((emotionLink.emotions as any)?.emotion || "");
        }
      } catch (error) {
        console.error("Error loading trade data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadTradeData();
  }, [trade.id]);

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant={trade.status === "利確" ? "default" : "destructive"}>{trade.status}</Badge>
              {displaySettings.show_symbol && (
                <span className="font-medium">{symbolName}</span>
              )}
              {displaySettings.show_profit && (
                <span className={`font-bold ${pnl > 0 ? "text-green-600" : "text-red-600"}`}>
                  {pnl > 0 ? "+" : ""}¥{Number(pnl).toLocaleString()}
                </span>
              )}
            </div>
            {displaySettings.show_direction && (
              <div className="font-medium text-sm">{getLongShortText(trade.type || trade.trade_type)}</div>
            )}
            {displaySettings.show_entry_time && (
              <div className="font-medium text-sm">
                エントリー: {trade.entry_time ? new Date(trade.entry_time).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : trade.time}
              </div>
            )}
            {displaySettings.show_exit_time && (
              <div className="font-medium text-sm">
                エグジット: {trade.exit_time ? new Date(trade.exit_time).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : ""}
              </div>
            )}
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

        {displaySettings.show_entry_price && (
          <div className="text-sm mb-1">
            エントリー価格: {trade.entry || trade.entry_price}
        </div>
        )}

        {displaySettings.show_exit_price && (
          <div className="text-sm mb-1">
            エグジット価格: {trade.exit || trade.exit_price}
        </div>
        )}

        {displaySettings.show_lot && trade.lot_size && (
          <div className="text-sm mb-1">
            ロット: {trade.lot_size}
          </div>
        )}

        {displaySettings.show_pips && trade.pips && (
          <div className="text-sm mb-1">
            pips: {trade.pips}
          </div>
        )}

        {displaySettings.show_hold_time && trade.hold_time && (
          <div className="text-sm mb-1">
            保有時間: {formatHoldTime(trade.hold_time)}
          </div>
        )}

        {displaySettings.show_emotion && tradeEmotion && !loadingData && (
          <div className="text-sm mb-1">
            感情: {tradeEmotion}
          </div>
        )}

        {displaySettings.show_tag && tradeTags.length > 0 && !loadingData && (
          <div className="flex flex-wrap gap-1 mb-1">
            {tradeTags.map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        )}

        {displaySettings.show_note && trade.trade_memo && (
          <div className="text-sm text-gray-600">
            メモ: {trade.trade_memo}
          </div>
        )}
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
  onDisplaySettings,
  displaySettings,
}: {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  trades: any[]
  onEditTrade: (trade: any) => void
  onDeleteTrade: (id: number) => void
  onAddTrade: () => void
  onDisplaySettings: () => void
  displaySettings: Record<string, boolean>
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
          <Button onClick={onAddTrade} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            取引追加
          </Button>
          <Button variant="outline" onClick={onDisplaySettings} className="w-full bg-transparent">
            <Filter className="mr-2 h-4 w-4" />
            表示設定
          </Button>
        </div>

        {/* Trade History */}
        <div className="p-4">
          <h4 className="font-medium mb-3">取引履歴</h4>
          {trades
            .sort((a, b) => {
              // Sort by exit_time (earliest first), then by entry_time, then by created_at
              const aTime = a.exit_time || a.entry_time || a.created_at;
              const bTime = b.exit_time || b.entry_time || b.created_at;
              return new Date(aTime).getTime() - new Date(bTime).getTime();
            })
            .map((trade) => (
              <TradeCard key={trade.id} trade={trade} onEdit={onEditTrade} onDelete={onDeleteTrade} displaySettings={displaySettings} />
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
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    // Create datetime strings from defaultDate for entry and exit times
    const createDateTimeString = (dateStr: string, timeStr: string = "00:00") => {
      return dateStr ? `${dateStr}T${timeStr}` : "";
    };
    
    const defaultDateStr = defaultDate || new Date().toISOString().split("T")[0];
    const currentTime = new Date().toTimeString().slice(0, 5); // Get current time in HH:MM format
    
    console.log("=== TradeEditDialog Initial State Debug ===");
    console.log("Initial trade:", trade);
    console.log("Initial defaultDate:", defaultDate);
    console.log("defaultDateStr:", defaultDateStr);
    console.log("currentTime:", currentTime);
    
    const [formData, setFormData] = useState<Partial<Trade>>(
    trade || {
      date: defaultDateStr,
      time: "",
      entryDateTime: createDateTimeString(defaultDateStr, currentTime),
      exitDateTime: createDateTimeString(defaultDateStr, currentTime),
      pair: "",
      type: "買い",
      entry: undefined,
      exit: undefined,
      lotSize: undefined,
      pips: undefined,
      profit: undefined,
      emotion: "",
      holdingTime: 0,
      holdingDays: 0,
      holdingHours: 0,
      holdingMinutes: 0,
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
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([])
  const [loadingSymbols, setLoadingSymbols] = useState(false)

    useEffect(() => {
    console.log("=== TradeEditDialog useEffect Debug ===");
    console.log("trade:", trade);
    console.log("defaultDate:", defaultDate);
    console.log("isOpen:", isOpen);
    
    // Create datetime strings from defaultDate for entry and exit times
    const createDateTimeString = (dateStr: string, timeStr: string = "00:00") => {
      return dateStr ? `${dateStr}T${timeStr}` : "";
    };
    
    const defaultDateStr = defaultDate || new Date().toISOString().split("T")[0];
    const currentTime = new Date().toTimeString().slice(0, 5); // Get current time in HH:MM format
    
    const newFormData = trade || {
      date: defaultDateStr,
      time: "",
      entryDateTime: createDateTimeString(defaultDateStr, currentTime),
      exitDateTime: createDateTimeString(defaultDateStr, currentTime),
      pair: "",
      type: "買い",
      entry: undefined,
      exit: undefined,
      lotSize: undefined,
      pips: undefined,
      profit: undefined,
      emotion: "",
      holdingTime: 0,
      holdingDays: 0,
      holdingHours: 0,
      holdingMinutes: 0,
      notes: "",
      tags: [],
    };
    
    console.log("Setting formData with date:", newFormData.date);
    console.log("Setting entryDateTime:", newFormData.entryDateTime);
    console.log("Setting exitDateTime:", newFormData.exitDateTime);
    console.log("Full newFormData:", newFormData);
    
    setFormData(newFormData);
    setHasUnsavedChanges(false);
  }, [trade, defaultDate, isOpen])

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

  // Load symbols from database
  const loadSymbolsFromDatabase = async () => {
    if (!user) return
    
    setLoadingSymbols(true)
    try {
      const { data, error } = await supabase
        .from("symbols")
        .select("symbol")
        .order("symbol")
      
      if (error) {
        console.error("Error loading symbols:", error)
        return
      }
      
      const symbols = data?.map(item => item.symbol) || []
      setAvailableSymbols(symbols)
    } catch (error) {
      console.error("Error loading symbols:", error)
    } finally {
      setLoadingSymbols(false)
    }
  }

  useEffect(() => {
    loadEmotionsFromDatabase()
    loadSymbolsFromDatabase()
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

  const handleFormChange = (updates: Partial<Trade>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    // Clear previous validation errors
    setValidationError("")
    
    console.log("=== TradeEditDialog handleSave Debug ===");
    console.log("Form data:", formData);
    
    // Validation: Check if required fields are filled
    if (!formData.pair || !formData.pair.trim()) {
      console.log("Validation failed: Missing symbol");
      setValidationError("シンボルを選択してください")
      return
    }
    
    if (formData.profit === undefined || formData.profit === null) {
      console.log("Validation failed: Missing profit");
      setValidationError("損益を入力してください")
      return
    }
    
    // Additional validation: Check if profit is a valid number
    const profitValue = Number.parseFloat(String(formData.profit));
    if (isNaN(profitValue)) {
      console.log("Validation failed: Invalid profit value");
      setValidationError("損益は有効な数値を入力してください")
      return
    }
    
    // Basic validation for numbers
    const parsedEntry = formData.entry !== undefined && formData.entry !== null ? Number.parseFloat(String(formData.entry)) : 0
    const parsedExit = formData.exit !== undefined && formData.exit !== null ? Number.parseFloat(String(formData.exit)) : 0
    const parsedLotSize = formData.lotSize !== undefined && formData.lotSize !== null ? Number.parseFloat(String(formData.lotSize)) : 0
    const parsedPips = formData.pips !== undefined && formData.pips !== null ? Number.parseFloat(String(formData.pips)) : 0
    const parsedProfit = formData.profit !== undefined && formData.profit !== null ? Number.parseFloat(String(formData.profit)) : 0

    console.log("Parsed values:", {
      entry: parsedEntry,
      exit: parsedExit,
      lotSize: parsedLotSize,
      pips: parsedPips,
      profit: parsedProfit
    });

    // Calculate holding time in seconds from actual entry and exit times
    let holdingTimeInSeconds = 0;
    
    if (formData.entryDateTime && formData.exitDateTime) {
      const entryDate = new Date(formData.entryDateTime);
      const exitDate = new Date(formData.exitDateTime);
      
      // Check if dates are valid
      if (!isNaN(entryDate.getTime()) && !isNaN(exitDate.getTime())) {
        const timeDiff = exitDate.getTime() - entryDate.getTime();
        holdingTimeInSeconds = Math.floor(timeDiff / 1000); // Convert milliseconds to seconds
        
        // Ensure positive value
        if (holdingTimeInSeconds < 0) {
          holdingTimeInSeconds = 0;
        }
      }
    } else {
      // Fallback to manual calculation if datetime fields are not available
      holdingTimeInSeconds = (formData.holdingDays || 0) * 24 * 60 * 60 + 
                            (formData.holdingHours || 0) * 60 * 60 + 
                            (formData.holdingMinutes || 0) * 60
    }

    console.log("Holding time in seconds:", holdingTimeInSeconds);

    const tradeDataToSave = {
      ...formData,
      entry: parsedEntry,
      exit: parsedExit,
      lotSize: parsedLotSize,
      pips: parsedPips,
      profit: parsedProfit,
      holdingTime: holdingTimeInSeconds,
    };

    console.log("Trade data to save:", tradeDataToSave);
    console.log("=== End TradeEditDialog handleSave Debug ===");

    onSave(tradeDataToSave)
    setHasUnsavedChanges(false);
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardWarning(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    setShowDiscardWarning(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
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
                  step="1"
                  value={formData.entryDateTime}
                  onChange={(e) => handleFormChange({ entryDateTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="exitDateTime">エグジット日時</Label>
                <Input
                  id="exitDateTime"
                  type="datetime-local"
                  step="1"
                  value={formData.exitDateTime}
                  onChange={(e) => handleFormChange({ exitDateTime: e.target.value })}
                />
              </div>
            </div>

                      <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pair">シンボル</Label>
              <Select
                value={formData.pair}
                onValueChange={(value) => handleFormChange({ pair: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="シンボルを選択" />
                </SelectTrigger>
                <SelectContent>
                  {loadingSymbols ? (
                    <SelectItem value="loading" disabled>読み込み中...</SelectItem>
                  ) : availableSymbols.length > 0 ? (
                    availableSymbols.map((symbol) => (
                      <SelectItem key={symbol} value={symbol}>
                        {symbol}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-symbols" disabled>シンボルがありません</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">取引種別</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleFormChange({ type: value as "買い" | "売り" })}
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
                value={formData.entry ?? ""}
                  onChange={(e) => handleFormChange({ entry: Number.parseFloat(e.target.value) })}
                  className="no-spinner"
              />
            </div>
            <div>
              <Label htmlFor="exit">エグジット価格</Label>
              <Input
                id="exit"
                type="number"
                  step="0.0001"
                value={formData.exit ?? ""}
                  onChange={(e) => handleFormChange({ exit: Number.parseFloat(e.target.value) })}
                  className="no-spinner"
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
                value={formData.lotSize ?? ""}
                onChange={(e) => handleFormChange({ lotSize: Number.parseFloat(e.target.value) })}
                placeholder="0.01"
                className="no-spinner"
              />
            </div>
            <div>
              <Label htmlFor="pips">pips</Label>
              <Input
                id="pips"
                type="number"
                step="0.1"
                value={formData.pips ?? ""}
                onChange={(e) => handleFormChange({ pips: Number.parseFloat(e.target.value) })}
                className="no-spinner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
          <div>
                <Label htmlFor="profit">損益 (¥)</Label>
              <Input
                  id="profit"
                  type="number"
                  value={formData.profit ?? ""}
                  onChange={(e) => handleFormChange({ profit: Number.parseFloat(e.target.value) })}
                  className="no-spinner"
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
                        handleFormChange({ emotion: "" })
                      } else {
                        // If not selected, select it
                        handleFormChange({ emotion: emotion })
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
                  onChange={(e) => handleFormChange({ 
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
                  onChange={(e) => handleFormChange({ 
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
                  onChange={(e) => handleFormChange({ 
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
                onChange={(e) => handleFormChange({ notes: e.target.value })}
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
                      onClick={() => {
                        const currentTags = formData.tags || []
                        if (currentTags.includes(tag)) {
                          handleFormChange({ tags: currentTags.filter(t => t !== tag) })
                        } else {
                          handleFormChange({ tags: [...currentTags, tag] })
                        }
                      }}
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
            <Button variant="outline" onClick={handleClose}>
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

      {/* Discard Changes Warning Dialog */}
      <AlertDialog open={showDiscardWarning} onOpenChange={setShowDiscardWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                保存されていない変更があります。
              </p>
              <p className="text-red-600">
                ⚠️ 現在入力されているデータは破棄されます。
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                この操作は取り消すことができません。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardWarning(false)}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDiscard}
              className="bg-red-600 hover:bg-red-700"
            >
              破棄
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function CSVImportDialog({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: any }) {
  const [isCustomBrokerOpen, setIsCustomBrokerOpen] = useState(false);
  const [customBrokerName, setCustomBrokerName] = useState("");
  const [customBrokerEmail, setCustomBrokerEmail] = useState("");
  const [customBrokerCSV, setCustomBrokerCSV] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>("");
  const [importError, setImportError] = useState<string>("");
  const [importSuccess, setImportSuccess] = useState<string>("");

  // Reset dialog state when it opens
  useEffect(() => {
    if (isOpen) {
      setImportProgress("");
      setImportError("");
      setImportSuccess("");
      setCsvFile(null);
      setSelectedBroker("");
    }
  }, [isOpen]);

  const handleCustomBrokerSubmit = async () => {
    if (!customBrokerName.trim() || !customBrokerEmail.trim() || !customBrokerCSV) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would typically send this data to your backend
      // For now, we'll just simulate a submission
      console.log("Custom broker request:", {
        brokerName: customBrokerName,
        email: customBrokerEmail,
        csvFile: customBrokerCSV.name
      });

      // Reset form
      setCustomBrokerName("");
      setCustomBrokerEmail("");
      setCustomBrokerCSV(null);
      setIsCustomBrokerOpen(false);
      
      // Show success message (you can implement a toast notification here)
      alert("リクエストが送信されました。開発チームが確認次第、対応いたします。");
    } catch (error) {
      console.error("Error submitting custom broker request:", error);
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSVFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCustomBrokerCSV(file);
    }
  };

  const handleMainCSVFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      setImportError("");
      setImportSuccess("");
    }
  };

  // Validate Hirose CSV format
  const validateHiroseCSV = async (file: File): Promise<boolean> => {
    try {
      // Try to read with proper encoding
      let text = await file.text();
      
      // Check if we have encoding issues (replacement characters)
      if (text.includes('')) {
        console.log('Detected encoding issues, trying to fix...');
        
        // Try reading as ArrayBuffer and decode with different encodings
        const arrayBuffer = await file.arrayBuffer();
        
        // Try Shift_JIS (common for Japanese files)
        try {
          const decoder = new TextDecoder('shift-jis');
          text = decoder.decode(arrayBuffer);
          console.log('Successfully decoded with Shift_JIS');
        } catch (shiftJisError) {
          console.log('Shift_JIS failed, trying other encodings...');
          
          // Try other common Japanese encodings
          const encodings = ['cp932', 'euc-jp', 'iso-2022-jp'];
          for (const encoding of encodings) {
            try {
              const decoder = new TextDecoder(encoding);
              text = decoder.decode(arrayBuffer);
              console.log(`Successfully decoded with ${encoding}`);
              break;
            } catch (e) {
              console.log(`${encoding} failed`);
            }
          }
        }
      }
      
      const lines = text.split('\n');
      
      console.log('CSV Content Preview:', text.substring(0, 500));
      console.log('First 5 lines:', lines.slice(0, 5));
      console.log('File encoding check - first line bytes:', Array.from(text.substring(0, 100)).map(c => c.charCodeAt(0)));
      
      // Check if file contains expected Hirose headers
      let foundHeaders = {
        決済約定日時: false,
        通貨ペア: false,
        売買: false,
        売買損益: false
      };
      
      // Check each line for headers (check first 10 lines)
      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i];
        console.log(`Line ${i}:`, line);
        
        // Check for exact matches and variations
        if (line.includes('決済約定日時') || line.includes('決済約定日')) {
          foundHeaders.決済約定日時 = true;
          console.log(`Found 決済約定日時 in line ${i}`);
        }
        if (line.includes('通貨ペア') || line.includes('通貨')) {
          foundHeaders.通貨ペア = true;
          console.log(`Found 通貨ペア in line ${i}`);
        }
        if (line.includes('売買')) {
          foundHeaders.売買 = true;
          console.log(`Found 売買 in line ${i}`);
        }
        if (line.includes('売買損益') || line.includes('損益')) {
          foundHeaders.売買損益 = true;
          console.log(`Found 売買損益 in line ${i}`);
        }
      }
      
      console.log('Found headers:', foundHeaders);
      
      // More flexible validation - require at least 3 out of 4 key headers
      const requiredHeaders = ['決済約定日時', '通貨ペア', '売買', '売買損益'];
      const foundCount = requiredHeaders.filter(header => {
        return foundHeaders[header as keyof typeof foundHeaders];
      }).length;
      
      console.log(`Found ${foundCount} out of ${requiredHeaders.length} required headers`);
      
      // Test for exact header format you provided
      const exactHeaderLine = '決済約定日時,注文番号,ポジション番号,通貨ペア,両建区分,注文手法,約定区分,執行条件,指定レート,売買,Lot数,新規約定日時,新規約定値,決済約定値,pip損益,円換算レート,売買損益,手数料,スワップ損益,決済損益,チャネル';
      const hasExactFormat = lines.some(line => line.trim() === exactHeaderLine);
      console.log('Has exact header format:', hasExactFormat);
      
      // Accept if we find at least 3 out of 4 headers OR the exact format
      const hasRequiredHeaders = foundCount >= 3 || hasExactFormat;
      
      return hasRequiredHeaders;
    } catch (error) {
      console.error('Error validating CSV file:', error);
      return false;
    }
  };

  // Import Hirose CSV
  const importHiroseCSV = async (file: File) => {
    try {
      setIsImporting(true);
      setImportProgress("CSVファイルを検証中...");
      
      // Validate CSV format
      const isValid = await validateHiroseCSV(file);
      if (!isValid) {
        setImportError("CSVファイルの形式が正しくありません。ヒロセ通商のCSVファイルをアップロードしてください。ブラウザのコンソールで詳細を確認できます。");
        setIsImporting(false);
        return;
      }

      setImportProgress("CSVファイルを解析中...");
      
      // Read CSV content with proper encoding
      let csvContent = await file.text();
      
      // Check if we have encoding issues and fix them
      if (csvContent.includes('')) {
        console.log('Fixing encoding for import...');
        const arrayBuffer = await file.arrayBuffer();
        
        try {
          const decoder = new TextDecoder('shift-jis');
          csvContent = decoder.decode(arrayBuffer);
          console.log('Successfully decoded import with Shift_JIS');
        } catch (shiftJisError) {
          console.log('Shift_JIS failed for import, trying other encodings...');
          
          const encodings = ['cp932', 'euc-jp', 'iso-2022-jp'];
          for (const encoding of encodings) {
            try {
              const decoder = new TextDecoder(encoding);
              csvContent = decoder.decode(arrayBuffer);
              console.log(`Successfully decoded import with ${encoding}`);
              break;
            } catch (e) {
              console.log(`${encoding} failed for import`);
            }
          }
        }
      }
      
      const lines = csvContent.split('\n');
      
      // Find the header row
      let headerIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('決済約定日時') && lines[i].includes('通貨ペア')) {
          headerIndex = i;
          break;
        }
      }
      
      if (headerIndex === -1) {
        setImportError("ヘッダー行が見つかりません。");
        setIsImporting(false);
        return;
      }
      
      // Process data rows
      const dataRows = lines.slice(headerIndex + 1).filter(line => line.trim());
      // Hirose CSV has 2 rows per transaction (entry and exit), so divide by 2
      const transactionCount = Math.floor(dataRows.length / 2);
      setImportProgress(`${transactionCount}件の取引を処理中...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = dataRows[i];
          const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
          
          // Skip rows with empty essential data
          if (!values[3] || !values[16] || !values[11] || !values[0]) {
            continue;
          }
          
          // Parse Japanese date format and convert to local datetime string for localDateTimeToUTC
          const parseJapaneseDateTime = (dateTimeStr: string): string => {
            console.log("=== parseJapaneseDateTime Debug ===");
            console.log("Input dateTimeStr:", dateTimeStr);
            console.log("Input length:", dateTimeStr.length);
            
            // Split by multiple spaces and filter out empty parts
            const parts = dateTimeStr.split(/\s+/).filter(part => part.trim() !== '');
            console.log("Parts after split:", parts);
            console.log("Parts length:", parts.length);
            
            if (parts.length < 2) {
              console.log("Not enough parts, returning current time");
              return new Date().toISOString();
            }
            
            const datePart = parts[0];
            const timePart = parts[1];
            console.log("Date part:", datePart);
            console.log("Time part:", timePart);
            
            const [year, month, day] = datePart.split('/').map(Number);
            console.log("Parsed date:", { day, month, year });
            
            let [hours, minutes, seconds = '00'] = timePart.split(':');
            console.log("Parsed time components:", { hours, minutes, seconds });
            
            // Handle AM/PM if present
            if (parts.length > 2) {
              const ampm = parts[2];
              console.log("AM/PM part:", ampm);
              const hour = parseInt(hours);
              if (ampm === '午後' && hour !== 12) {
                hours = (hour + 12).toString();
                console.log("Converted to 24-hour format:", hours);
              } else if (ampm === '午前' && hour === 12) {
                hours = '00';
                console.log("Converted 12 AM to 00:", hours);
              }
            }
            
            // Create a Date object in local timezone and convert to UTC ISO string
            const localDate = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), parseInt(seconds));
            const utcResult = localDate.toISOString();
            console.log("Local date object:", localDate);
            console.log("Final UTC result:", utcResult);
            console.log("=== End parseJapaneseDateTime Debug ===");
            
            return utcResult;
          };
          
          // Convert lot size (10000 currency per lot to 1000 currency per lot)
          const convertLotSize = (lotSizeStr: string): number => {
            const lotSize = parseFloat(lotSizeStr);
            return lotSize / 10;
          };
          
          // Convert trade type (inverted because 決済約定日時 means exit, so 売買 is opposite)
          const convertTradeType = (buySellStr: string): number => {
            return buySellStr === '売' ? 0 : 1; // 売 (sell) = 0 (buy), 買 (buy) = 1 (sell)
          };
          
          // Calculate holding time (difference between settlement and new contract times)
          const calculateHoldTime = (entryTime: string, exitTime: string): number => {
            const entry = new Date(entryTime);
            const exit = new Date(exitTime);
            
            // Calculate time difference in seconds
            const timeDiffMs = exit.getTime() - entry.getTime();
            const timeDiffSeconds = Math.floor(timeDiffMs / 1000);
            
            // Ensure positive value (exit time should be after entry time)
            return Math.max(0, timeDiffSeconds);
          };
          
          // Get or create symbol
          const getOrCreateSymbol = async (symbolName: string): Promise<string> => {
            const { data: existingSymbol, error: findError } = await supabase
              .from('symbols')
              .select('id')
              .eq('symbol', symbolName)
              .single();
            
            if (findError && findError.code !== 'PGRST116') {
              throw new Error(`Error finding symbol: ${findError.message}`);
            }
            
            if (existingSymbol) {
              return existingSymbol.id;
            }
            
            const { data: newSymbol, error: insertError } = await supabase
              .from('symbols')
              .insert({ symbol: symbolName })
              .select('id')
              .single();
            
            if (insertError) {
              throw new Error(`Error creating symbol: ${insertError.message}`);
            }
            
            return newSymbol.id;
          };
          
          // Parse trade data
          console.log("=== CSV Trade Data Parsing Debug ===");
          console.log("Raw entry time from CSV:", values[11]); // 新規約定日時
          console.log("Raw exit time from CSV:", values[0]);   // 決済約定日時
          
          const entryDateTime = parseJapaneseDateTime(values[11]); // 新規約定日時
          const exitDateTime = parseJapaneseDateTime(values[0]);   // 決済約定日時
          
          console.log("Parsed entry datetime:", entryDateTime);
          console.log("Parsed exit datetime:", exitDateTime);
          
          const entryTime = localDateTimeToUTC(entryDateTime);
          const exitTime = localDateTimeToUTC(exitDateTime);
          
          console.log("Final entry time (UTC):", entryTime);
          console.log("Final exit time (UTC):", exitTime);
          console.log("=== End CSV Trade Data Parsing Debug ===");
          const lotSize = convertLotSize(values[10]);          // Lot数
          const tradeType = convertTradeType(values[9]);       // 売買
          const profitLoss = parseFloat(values[16]);           // 売買損益
          const entryPrice = parseFloat(values[12]);           // 新規約定値
          const exitPrice = parseFloat(values[13]);            // 決済約定値
          const pips = (parseFloat(values[14]) || 0) / 10;     // pip損益 (divide by 10 for Hirose)
          const holdTime = calculateHoldTime(entryTime, exitTime);
          
          // Get or create symbol
          const symbolId = await getOrCreateSymbol(values[3]); // 通貨ペア
          
          // Trade memo should be empty
          const tradeMemo = "";
          
          // Insert trade into database
          const { error: insertError } = await supabase
            .from('trades')
            .insert({
              user_id: user.id,
              symbol: symbolId,
              entry_price: entryPrice,
              exit_price: exitPrice,
              lot_size: lotSize,
              trade_type: tradeType,
              entry_time: entryTime,
              exit_time: exitTime,
              profit_loss: profitLoss,
              pips: pips,
              trade_memo: tradeMemo,
              hold_time: holdTime,
            });
          
          if (insertError) {
            console.error(`Error inserting trade ${i + 1}:`, insertError);
            errorCount++;
          } else {
            successCount++;
            if (successCount % 10 === 0) {
              setImportProgress(`${successCount}/${transactionCount}件の取引を処理完了...`);
            }
          }
          
        } catch (rowError) {
          console.error(`Error processing row ${i + 1}:`, rowError);
          errorCount++;
        }
      }
      
      setImportProgress("");
      setImportSuccess(`${successCount}件の取引をインポートしました。${errorCount > 0 ? ` (${errorCount}件エラー)` : ''}`);
      
      // Close the dialog after successful import
      if (successCount > 0) {
        setTimeout(() => {
          onClose();
        }, 2000); // Close after 2 seconds to show success message
      }
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      setImportError(`インポートエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (!csvFile) {
      setImportError("CSVファイルを選択してください。");
      return;
    }
    
    if (selectedBroker === "hirose") {
      await importHiroseCSV(csvFile);
    } else {
      setImportError("このブローカーのインポート機能はまだ実装されていません。");
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CSV インポート</DialogTitle>
          <DialogDescription>取引データをCSVファイルからインポートします</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="broker">ブローカー</Label>
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
              <SelectTrigger>
                <SelectValue placeholder="ブローカーを選択" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="hirose">ヒロセ通商</SelectItem>
                <SelectItem value="mt4">MetaTrader 4</SelectItem>
                <SelectItem value="mt5">MetaTrader 5</SelectItem>
              </SelectContent>
            </Select>
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800 mt-2"
                onClick={() => setIsCustomBrokerOpen(true)}
              >
                ブローカーがない？
              </Button>
          </div>

          <div>
            <Label htmlFor="csvFile">CSVファイル</Label>
              <Input 
                id="csvFile" 
                type="file" 
                accept=".csv" 
                onChange={handleMainCSVFileChange}
                disabled={isImporting}
              />
              {csvFile && (
                <p className="text-sm text-green-600 mt-1">
                  選択されたファイル: {csvFile.name}
                </p>
              )}
          </div>

            {importProgress && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">{importProgress}</p>
              </div>
            )}

            {importError && (
              <div className="bg-red-50 p-3 rounded-md">
                <p className="text-sm text-red-800">{importError}</p>
              </div>
            )}

            {importSuccess && (
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm text-green-800">{importSuccess}</p>
              </div>
            )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose} disabled={isImporting}>
            キャンセル
          </Button>
            <Button 
              onClick={handleImport} 
              disabled={!csvFile || !selectedBroker || isImporting}
            >
              {isImporting ? "インポート中..." : "インポート"}
            </Button>
        </div>
      </DialogContent>
    </Dialog>

      {/* Custom Broker Request Dialog */}
      <Dialog open={isCustomBrokerOpen} onOpenChange={setIsCustomBrokerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新しいブローカーの追加リクエスト</DialogTitle>
            <DialogDescription>
              サポートされていないブローカーのCSVファイルを送信して、自動インポート機能の追加をリクエストできます。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="brokerName">ブローカー名 *</Label>
              <Input
                id="brokerName"
                placeholder="例: FXCM, IG, Saxo Bank"
                value={customBrokerName}
                onChange={(e) => setCustomBrokerName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={customBrokerEmail}
                onChange={(e) => setCustomBrokerEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                対応完了時に通知をお送りします
              </p>
            </div>

            <div>
              <Label htmlFor="csvSample">CSVファイルサンプル *</Label>
              <Input
                id="csvSample"
                type="file"
                accept=".csv"
                onChange={handleCSVFileChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                取引履歴のCSVファイルをアップロードしてください
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>注意:</strong> 開発チームがCSVファイルの形式を確認し、
                自動インポート機能を実装いたします。対応には数日かかる場合があります。
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsCustomBrokerOpen(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleCustomBrokerSubmit}
              disabled={!customBrokerName.trim() || !customBrokerEmail.trim() || !customBrokerCSV || isSubmitting}
            >
              {isSubmitting ? "送信中..." : "リクエスト送信"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DisplaySettingsDialog({ 
  isOpen, 
  onClose, 
  displaySettings, 
  onSaveSettings 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  displaySettings: Record<string, boolean>;
  onSaveSettings: (settings: Record<string, boolean>) => void;
}) {
  const [settings, setSettings] = useState<Record<string, boolean>>(displaySettings);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(displaySettings);
      setHasUnsavedChanges(false);
    }
  }, [displaySettings, isOpen]);

  const handleSettingChange = (settingId: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [settingId]: checked }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    onSaveSettings(settings);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardWarning(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    setShowDiscardWarning(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>表示設定</DialogTitle>
          <DialogDescription>取引履歴カードの表示項目を設定します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {[
              { id: "show_symbol", label: "シンボル", checked: true, disabled: true },
              { id: "show_profit", label: "損益", checked: true, disabled: true },
              { id: "show_direction", label: "ロング/ショート", checked: true, disabled: false },
              { id: "show_entry_time", label: "エントリー時間", checked: true, disabled: false },
              { id: "show_exit_time", label: "エグジット時間", checked: true, disabled: false },
              { id: "show_entry_price", label: "エントリー価格", checked: true, disabled: false },
              { id: "show_exit_price", label: "エグジット価格", checked: true, disabled: false },
              { id: "show_lot", label: "ロット", checked: true, disabled: false },
              { id: "show_pips", label: "pips", checked: true, disabled: false },
              { id: "show_hold_time", label: "保有時間", checked: true, disabled: false },
              { id: "show_emotion", label: "感情", checked: true, disabled: false },
              { id: "show_tag", label: "タグ", checked: true, disabled: false },
              { id: "show_note", label: "メモ", checked: true, disabled: false },
          ].map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={item.id} 
                  checked={settings[item.id] || false}
                  disabled={item.disabled}
                  onCheckedChange={(checked) => {
                    if (!item.disabled) {
                      handleSettingChange(item.id, checked as boolean);
                    }
                  }}
                />
                <Label htmlFor={item.id} className={item.disabled ? "text-gray-500" : ""}>
                  {item.label}
                </Label>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
            <Button onClick={handleSave}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>

      {/* Discard Changes Warning Dialog */}
      <AlertDialog open={showDiscardWarning} onOpenChange={setShowDiscardWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>設定を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                保存されていない設定変更があります。
              </p>
              <p className="text-red-600">
                ⚠️ 現在の設定変更は破棄されます。
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                この操作は取り消すことができません。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardWarning(false)}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDiscard}
              className="bg-red-600 hover:bg-red-700"
            >
              破棄
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
  const [displaySettings, setDisplaySettings] = useState<Record<string, boolean>>({
    show_symbol: true,
    show_direction: true,
    show_entry_price: true,
    show_exit_price: true,
    show_entry_time: true,
    show_exit_time: true,
    show_hold_time: true,
    show_emotion: true,
    show_tag: true,
    show_lot: true,
    show_pips: true,
    show_profit: true,
    show_note: true,
  });

  // Load display settings from database
  const loadDisplaySettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("trade_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error loading display settings:", error);
        return;
      }
      
      if (data) {
        setDisplaySettings({
          show_symbol: data.show_symbol ?? true,
          show_direction: data.show_direction ?? true,
          show_entry_price: data.show_entry_price ?? true,
          show_exit_price: data.show_exit_price ?? true,
          show_entry_time: data.show_entry_time ?? true,
          show_exit_time: data.show_exit_time ?? true,
          show_hold_time: data.show_hold_time ?? true,
          show_emotion: data.show_emotion ?? true,
          show_tag: data.show_tag ?? true,
          show_lot: data.show_lot ?? true,
          show_pips: data.show_pips ?? true,
          show_profit: data.show_profit ?? true,
          show_note: data.show_note ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading display settings:", error);
    }
  };

  useEffect(() => {
    loadTrades();
  }, [user]);

  // Function to load trades
  const loadTrades = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("trades")
        .select(`
          *,
          symbols!inner(symbol)
        `)
        .eq("user_id", user.id);
      
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
    } catch (error) {
      setError("Failed to load trades");
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  // Load display settings when user changes
  useEffect(() => {
    loadDisplaySettings();
  }, [user]);

  const groupedTrades = groupTradesByDate(trades);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setIsRightSidebarOpen(true);
  };

  const handleEditTrade = async (trade: any) => {
    try {
      // Load trade tags
      let tradeTags: string[] = [];
      let tradeEmotion: string = "";
      
      if (trade.id) {
        // Load tags
        const { data: tagLinks, error: tagError } = await supabase
          .from("trade_tag_links")
          .select(`
            tag_id,
            trade_tags(tag_name)
          `)
          .eq("trade_id", trade.id);
        
        if (tagError) {
          console.error("Error loading trade tags:", tagError);
        } else {
          tradeTags = tagLinks?.map(link => (link.trade_tags as any)?.tag_name).filter(Boolean) || [];
          console.log("Loaded trade tags:", tradeTags);
        }
        
        // Load emotion
        const { data: emotionLinks, error: emotionError } = await supabase
          .from("trade_emotion_links")
          .select(`
            emotion_id,
            emotions(emotion)
          `)
          .eq("trade_id", trade.id);
        
        if (emotionError) {
          console.error("Error loading trade emotion:", emotionError);
        } else if (emotionLinks && emotionLinks.length > 0) {
          const emotionLink = emotionLinks[0];
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

    }
  };

  const handleAddTrade = () => {
    setEditingTrade(null);
    // If no date is selected, use today's date
    if (!selectedDate) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
    }
    setIsTradeDialogOpen(true);
  };

  const handleSaveTrade = async (tradeData: Partial<Trade>) => {
    if (!user) return;
    
    console.log("=== handleSaveTrade Debug ===");
    console.log("Saving trade data:", tradeData);
    console.log("User ID:", user.id);
    console.log("Trade data type:", typeof tradeData);
    console.log("Trade data keys:", Object.keys(tradeData));
    
    // Validate required fields
    if (!tradeData.pair || !tradeData.pair.trim()) {
      setError("シンボルは必須です");
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
          entry_time: (() => {
            const result = localDateTimeToUTC(tradeData.entryDateTime || "");
            console.log("Update - Entry time conversion:", { input: tradeData.entryDateTime, output: result });
            return result;
          })(),
          exit_time: (() => {
            const result = localDateTimeToUTC(tradeData.exitDateTime || "");
            console.log("Update - Exit time conversion:", { input: tradeData.exitDateTime, output: result });
            return result;
          })(),
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
          entry_time: (() => {
            const result = localDateTimeToUTC(tradeData.entryDateTime || "");
            console.log("Insert - Entry time conversion:", { input: tradeData.entryDateTime, output: result });
            return result;
          })(),
          exit_time: (() => {
            const result = localDateTimeToUTC(tradeData.exitDateTime || "");
            console.log("Insert - Exit time conversion:", { input: tradeData.exitDateTime, output: result });
            return result;
          })(),
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
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          console.error("Insert data that failed:", insertData);
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

  const confirmDelete = async () => {
    if (!deleteTradeId || !user) {
      setDeleteTradeId(null);
      return;
    }

    try {
      // Delete related records first (foreign key constraints)
      
      // Delete trade emotion links
      const { error: emotionError } = await supabase
        .from("trade_emotion_links")
        .delete()
        .eq("trade_id", deleteTradeId);

      if (emotionError) {
        console.error("Error deleting trade emotion links:", emotionError);
      }

      // Delete trade tag links
      const { error: tagError } = await supabase
        .from("trade_tag_links")
        .delete()
        .eq("trade_id", deleteTradeId);

      if (tagError) {
        console.error("Error deleting trade tag links:", tagError);
      }

      // Delete the main trade record
      const { error: tradeError } = await supabase
        .from("trades")
        .delete()
        .eq("id", deleteTradeId)
        .eq("user_id", user.id);

      if (tradeError) {
        console.error("Error deleting trade:", tradeError);
        setError("取引の削除中にエラーが発生しました");
        return;
      }

      // Refresh the trades data
      await loadTrades();
      
      console.log("Trade deleted successfully");
    } catch (error) {
      console.error("Error deleting trade:", error);
      setError("取引の削除中にエラーが発生しました");
    } finally {
      setDeleteTradeId(null);
    }
  };

  const handleSaveDisplaySettings = async (settings: Record<string, boolean>) => {
    if (!user) return;
    
    try {
      // Check if settings exist for this user
      const { data: existingSettings, error: checkError } = await supabase
        .from("trade_settings")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing settings:", checkError);
        return;
      }
      
      const settingsData = {
        user_id: user.id,
        show_symbol: settings.show_symbol,
        show_direction: settings.show_direction,
        show_entry_price: settings.show_entry_price,
        show_exit_price: settings.show_exit_price,
        show_entry_time: settings.show_entry_time,
        show_exit_time: settings.show_exit_time,
        show_hold_time: settings.show_hold_time,
        show_emotion: settings.show_emotion,
        show_tag: settings.show_tag,
        show_lot: settings.show_lot,
        show_pips: settings.show_pips,
        show_profit: settings.show_profit,
        show_note: settings.show_note,
        updated_at: new Date().toISOString(),
      };
      
      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from("trade_settings")
          .update(settingsData)
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Error updating display settings:", updateError);
          return;
        }
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from("trade_settings")
          .insert([{
            ...settingsData,
            created_at: new Date().toISOString(),
          }]);
        
        if (insertError) {
          console.error("Error inserting display settings:", insertError);
          return;
        }
      }
      
      // Update local state
      setDisplaySettings(settings);
      console.log("Display settings saved successfully");
    } catch (error) {
      console.error("Error saving display settings:", error);
    }
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
              <MonthlyNavigation currentDate={currentDate} onDateChange={setCurrentDate} trades={trades} onImportCSV={() => setIsCSVDialogOpen(true)} />
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
          onDisplaySettings={() => setIsDisplaySettingsOpen(true)}
          displaySettings={displaySettings}
        />
        <TradeEditDialog
          trade={editingTrade}
          isOpen={isTradeDialogOpen}
          onClose={() => setIsTradeDialogOpen(false)}
          onSave={handleSaveTrade}
          defaultDate={selectedDate}
          user={user}
        />
        <CSVImportDialog 
          isOpen={isCSVDialogOpen} 
          onClose={() => {
            setIsCSVDialogOpen(false);
            // Refresh trades data after CSV import
            loadTrades();
          }} 
          user={user} 
        />
        <DisplaySettingsDialog 
          isOpen={isDisplaySettingsOpen} 
          onClose={() => setIsDisplaySettingsOpen(false)}
          displaySettings={displaySettings}
          onSaveSettings={handleSaveDisplaySettings}
        />
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
