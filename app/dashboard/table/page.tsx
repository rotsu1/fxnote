"use client"
import { useState, useMemo, useCallback, useEffect } from "react"
import { CardDescription } from "@/components/ui/card"

import {
  CalendarIcon,
  Settings,
  Plus,
  Edit,
  Trash2,
  Tag,
} from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  AppSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// Sample trade data (expanded for table view)
interface Trade {
  id: number
  date: string
  time: string
  pair: string
  type: "買い" | "売り"
  entry: number
  exit: number
  pips: number
  profit: number
  emotion: string
  holdingTime: string
  notes?: string
  tags: string[]
}

const initialTrades: Trade[] = [
  {
    id: 1,
    date: "2024-01-15",
    time: "09:30",
    pair: "USD/JPY",
    type: "買い",
    entry: 148.5,
    exit: 149.2,
    pips: 70,
    profit: 3200,
    emotion: "興奮",
    holdingTime: "1h 15m",
    notes: "米国経済指標の好調により上昇。利確ポイントで決済。",
    tags: ["スキャルピング", "朝"],
  },
  {
    id: 2,
    date: "2024-01-15",
    time: "14:15",
    pair: "EUR/USD",
    type: "売り",
    entry: 1.095,
    exit: 1.092,
    pips: 30,
    profit: -1800,
    emotion: "焦り",
    holdingTime: "0h 45m",
    notes: "サポートラインを割ったが、すぐに反発。損切りが遅れた。",
    tags: ["デイトレード"],
  },
  {
    id: 3,
    date: "2024-01-14",
    time: "11:00",
    pair: "GBP/JPY",
    type: "買い",
    entry: 185.2,
    exit: 186.8,
    pips: 160,
    profit: 5400,
    emotion: "冷静",
    holdingTime: "2h 30m",
    notes: "日足のトレンドに沿ってエントリー。順調に伸びた。",
    tags: ["スイング"],
  },
  {
    id: 4,
    date: "2024-01-14",
    time: "16:30",
    pair: "USD/JPY",
    type: "売り",
    entry: 148.8,
    exit: 148.5,
    pips: 30,
    profit: 2100,
    emotion: "満足",
    holdingTime: "0h 20m",
    notes: "短期的な反発を狙った。素早い利確。",
    tags: ["スキャルピング"],
  },
  {
    id: 5,
    date: "2024-01-13",
    time: "13:45",
    pair: "AUD/USD",
    type: "買い",
    entry: 0.675,
    exit: 0.672,
    pips: 30,
    profit: -2900,
    emotion: "後悔",
    holdingTime: "1h 00m",
    notes: "サポートラインが機能せず、損切り。分析不足。",
    tags: ["デイトレード", "失敗"],
  },
]

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

const emotions = ["興奮", "焦り", "冷静", "満足", "後悔", "不安", "自信"]
const strategies = [
  "ブレイクアウト",
  "レンジブレイク",
  "押し目買い",
  "逆張り",
  "トレンドフォロー",
  "カウンタートレード",
]

// Column definitions for settings and table rendering
const allColumns = [
  { id: "date", label: "日付", type: "date", defaultVisible: true, minWidth: "min-w-[100px]" },
  { id: "time", label: "時間", type: "time", defaultVisible: true, minWidth: "min-w-[80px]" },
  { id: "pair", label: "通貨ペア", type: "text", defaultVisible: true, minWidth: "min-w-[100px]" },
  {
    id: "type",
    label: "種別",
    type: "select",
    options: ["買い", "売り"],
    defaultVisible: true,
    minWidth: "min-w-[60px]",
  },
  { id: "entry", label: "エントリー", type: "number", defaultVisible: true, minWidth: "min-w-[90px]" },
  { id: "exit", label: "エグジット", type: "number", defaultVisible: true, minWidth: "min-w-[90px]" },
  { id: "pips", label: "pips", type: "number", defaultVisible: true, minWidth: "min-w-[70px]" },
  { id: "profit", label: "損益 (¥)", type: "number", defaultVisible: true, minWidth: "min-w-[90px]" },
  { id: "emotion", label: "感情", type: "select", options: emotions, defaultVisible: true, minWidth: "min-w-[90px]" },
  { id: "holdingTime", label: "保有時間", type: "text", defaultVisible: true, minWidth: "min-w-[100px]" },
  { id: "notes", label: "メモ", type: "textarea", defaultVisible: false, minWidth: "min-w-[200px]" },
  { id: "tags", label: "タグ", type: "tags", defaultVisible: false, minWidth: "min-w-[150px]" },
]

// Reusing TradeEditDialog from calendar page, slightly modified for new fields
function TradeEditDialog({
  trade,
  isOpen,
  onClose,
  onSave,
  defaultDate,
}: {
  trade: Partial<Trade> | null
  isOpen: boolean
  onClose: () => void
  onSave: (trade: Partial<Trade>) => void
  defaultDate?: string
}) {
  const [formData, setFormData] = useState<Partial<Trade>>(
    trade || {
      date: defaultDate || format(new Date(), "yyyy-MM-dd"),
      pair: "",
      type: "買い",
      entry: undefined,
      exit: undefined,
      pips: undefined,
      profit: undefined,
      emotion: "",
      holdingTime: "",
      notes: "",
      tags: [],
    },
  )
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    setFormData(
      trade || {
        date: defaultDate || format(new Date(), "yyyy-MM-dd"),
        pair: "",
        type: "買い",
        entry: undefined,
        exit: undefined,
        pips: undefined,
        profit: undefined,
        emotion: "",
        holdingTime: "",
        notes: "",
        tags: [],
      },
    )
  }, [trade, defaultDate])

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

  const handleSave = () => {
    // Basic validation for numbers
    const parsedEntry = formData.entry !== undefined ? Number.parseFloat(String(formData.entry)) : undefined
    const parsedExit = formData.exit !== undefined ? Number.parseFloat(String(formData.exit)) : undefined
    const parsedPips = formData.pips !== undefined ? Number.parseFloat(String(formData.pips)) : undefined
    const parsedProfit = formData.profit !== undefined ? Number.parseFloat(String(formData.profit)) : undefined

    onSave({
      ...formData,
      entry: parsedEntry,
      exit: parsedExit,
      pips: parsedPips,
      profit: parsedProfit,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trade?.id ? "取引編集" : "新規取引"}</DialogTitle>
          <DialogDescription>取引の詳細を入力または編集してください。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
              <Label htmlFor="pips">pips</Label>
              <Input
                id="pips"
                type="number"
                step="0.1"
                value={formData.pips}
                onChange={(e) => setFormData({ ...formData, pips: Number.parseFloat(e.target.value) })}
              />
            </div>
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

          <div>
            <Label htmlFor="emotion">感情</Label>
            <Select value={formData.emotion} onValueChange={(value) => setFormData({ ...formData, emotion: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emotions.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="holdingTime">保有時間</Label>
            <Input
              id="holdingTime"
              value={formData.holdingTime}
              onChange={(e) => setFormData({ ...formData, holdingTime: e.target.value })}
              placeholder="例: 1h 30m"
            />
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

            <div className="mb-3">
              <div className="text-sm text-muted-foreground mb-2">既存のタグから選択:</div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto border rounded p-2">
                {availableTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant={formData.tags?.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => addExistingTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {formData.tags?.map((tag: string, index: number) => (
                <Badge key={index} variant="default" className="cursor-pointer" onClick={() => removeTag(tag)}>
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
          <Button onClick={handleSave}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TableSettingsDialog({
  isOpen,
  onClose,
  visibleColumns,
  onToggleColumn,
}: {
  isOpen: boolean
  onClose: () => void
  visibleColumns: string[]
  onToggleColumn: (columnId: string, isVisible: boolean) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>表示設定</DialogTitle>
          <DialogDescription>テーブルに表示する列を選択してください。</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {allColumns.map((column) => (
            <div key={column.id} className="flex items-center space-x-2">
              <Checkbox
                id={`col-${column.id}`}
                checked={visibleColumns.includes(column.id)}
                onCheckedChange={(checked) => onToggleColumn(column.id, checked as boolean)}
              />
              <Label htmlFor={`col-${column.id}`}>{column.label}</Label>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function TablePage() {
  const [trades, setTrades] = useState<Trade[]>(initialTrades)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2024, 0, 15)) // Default to a date with data
  const [editingCell, setEditingCell] = useState<{ id: number; field: keyof Trade } | null>(null)
  const [editingTrade, setEditingTrade] = useState<Partial<Trade> | null>(null)
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false)
  const [isTableSettingsOpen, setIsTableSettingsOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    allColumns.filter((col) => col.defaultVisible).map((col) => col.id),
  )

  const filteredTrades = useMemo(() => {
    if (!selectedDate) return []
    const dateString = format(selectedDate, "yyyy-MM-dd")
    return trades.filter((trade) => trade.date === dateString)
  }, [trades, selectedDate])

  const handleCellClick = (id: number, field: keyof Trade) => {
    setEditingCell({ id, field })
  }

  const handleCellChange = useCallback((id: number, field: keyof Trade, value: any) => {
    setTrades((prevTrades) => prevTrades.map((trade) => (trade.id === id ? { ...trade, [field]: value } : trade)))
  }, [])

  const handleCellBlur = () => {
    setEditingCell(null)
  }

  const handleAddTrade = () => {
    setEditingTrade(null) // Clear any previous editing state
    setIsTradeDialogOpen(true)
  }

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade)
    setIsTradeDialogOpen(true)
  }

  const handleSaveTrade = (tradeData: Partial<Trade>) => {
    if (editingTrade?.id) {
      // Update existing trade
      setTrades((prevTrades) =>
        prevTrades.map((t) => (t.id === editingTrade.id ? ({ ...t, ...tradeData } as Trade) : t)),
      )
    } else {
      // Add new trade
      const newId = trades.length > 0 ? Math.max(...trades.map((t) => t.id)) + 1 : 1
      setTrades((prevTrades) => [{ ...tradeData, id: newId } as Trade, ...prevTrades])
    }
    setIsTradeDialogOpen(false)
    setEditingTrade(null)
  }

  const handleDeleteTrade = (id: number) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setTrades((prevTrades) => prevTrades.filter((t) => t.id !== deleteConfirmId))
      setDeleteConfirmId(null)
    }
  }

  const handleToggleColumn = (columnId: string, isVisible: boolean) => {
    setVisibleColumns((prev) => (isVisible ? [...prev, columnId] : prev.filter((id) => id !== columnId)))
  }

  const getColumnValue = (trade: Trade, columnId: string) => {
    const column = allColumns.find((c) => c.id === columnId)
    if (!column) return ""

    const value = trade[column.id as keyof Trade]

    if (column.id === "profit" && typeof value === "number") {
      return `¥${value.toLocaleString()}`
    }
    if (column.id === "pips" && typeof value === "number") {
      return `${value} pips`
    }
    if (column.id === "tags" && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )
    }
    return String(value)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">取引履歴テーブル</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: ja }) : <span>日付を選択</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus locale={ja} />
              </PopoverContent>
            </Popover>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleAddTrade}>
                <Plus className="mr-2 h-4 w-4" />
                取引を追加
              </Button>
              <Button variant="outline" onClick={() => setIsTableSettingsOpen(true)}>
                <Settings className="h-4 w-4" />
                <span className="sr-only">設定</span>
              </Button>
            </div>
          </div>

          {/* Trade History Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"} の取引
              </CardTitle>
              <CardDescription>{filteredTrades.length}件の取引が見つかりました</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[calc(100vh-250px)]">
                {" "}
                {/* Max height for scroll */}
                <Table className="min-w-full">
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      {visibleColumns.map((colId) => {
                        const column = allColumns.find((c) => c.id === colId)
                        return column ? (
                          <TableHead key={column.id} className={column.minWidth}>
                            {column.label}
                          </TableHead>
                        ) : null
                      })}
                      <TableHead className="min-w-[80px] text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.length > 0 ? (
                      filteredTrades.map((trade) => (
                        <TableRow key={trade.id}>
                          {visibleColumns.map((colId) => {
                            const column = allColumns.find((c) => c.id === colId)
                            if (!column) return null

                            const isEditing = editingCell?.id === trade.id && editingCell.field === column.id
                            const value = trade[column.id as keyof Trade]

                            return (
                              <TableCell
                                key={column.id}
                                onClick={() => handleCellClick(trade.id, column.id as keyof Trade)}
                                className="py-2 px-4 border-b border-r last:border-r-0"
                              >
                                {isEditing ? (
                                  column.type === "select" ? (
                                    <Select
                                      value={String(value)}
                                      onValueChange={(val) => handleCellChange(trade.id, column.id as keyof Trade, val)}
                                      onOpenChange={(open) => !open && handleCellBlur()}
                                      autoFocus
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(column.options || []).map((option) => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : column.type === "textarea" ? (
                                    <Textarea
                                      value={String(value)}
                                      onChange={(e) =>
                                        handleCellChange(trade.id, column.id as keyof Trade, e.target.value)
                                      }
                                      onBlur={handleCellBlur}
                                      autoFocus
                                      rows={2}
                                      className="min-w-[150px]"
                                    />
                                  ) : (
                                    <Input
                                      type={
                                        column.type === "number"
                                          ? "number"
                                          : column.type === "date"
                                            ? "date"
                                            : column.type === "time"
                                              ? "time"
                                              : "text"
                                      }
                                      step={
                                        column.type === "number"
                                          ? column.id === "entry" || column.id === "exit"
                                            ? "0.0001"
                                            : "0.1"
                                          : undefined
                                      }
                                      value={String(value)}
                                      onChange={(e) =>
                                        handleCellChange(trade.id, column.id as keyof Trade, e.target.value)
                                      }
                                      onBlur={handleCellBlur}
                                      autoFocus
                                      className="h-8"
                                    />
                                  )
                                ) : (
                                  <span
                                    className={cn(
                                      column.id === "profit" &&
                                        (trade.profit && trade.profit > 0
                                          ? "text-green-600"
                                          : trade.profit && trade.profit < 0
                                            ? "text-red-600"
                                            : ""),
                                      column.id === "pips" &&
                                        (trade.pips && trade.pips > 0
                                          ? "text-green-600"
                                          : trade.pips && trade.pips < 0
                                            ? "text-red-600"
                                            : ""),
                                      "block min-h-[24px] py-1", // Ensure consistent height
                                    )}
                                  >
                                    {getColumnValue(trade, column.id)}
                                  </span>
                                )}
                              </TableCell>
                            )
                          })}
                          <TableCell className="py-2 px-4 border-b text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditTrade(trade)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">編集</span>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTrade(trade.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">削除</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumns.length + 1}
                          className="h-24 text-center text-muted-foreground"
                        >
                          選択された日付の取引はありません。
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Modals */}
        <TradeEditDialog
          trade={editingTrade}
          isOpen={isTradeDialogOpen}
          onClose={() => setIsTradeDialogOpen(false)}
          onSave={handleSaveTrade}
          defaultDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
        />

        <TableSettingsDialog
          isOpen={isTableSettingsOpen}
          onClose={() => setIsTableSettingsOpen(false)}
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
        />

        <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
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
  )
}
