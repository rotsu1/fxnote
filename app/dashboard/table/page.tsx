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
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Loader2,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

// Sample trade data (expanded for table view)
interface Trade {
  id: number
  date: string
  time: string
  entryTime: string
  exitTime: string
  pair: string
  type: "買い" | "売り"
  lot: number
  entry: number
  exit: number
  pips: number
  profit: number
  emotion: string
  holdingTime: number
  holdingDays?: number
  holdingHours?: number
  holdingMinutes?: number
  holdingSeconds?: number
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
  { id: "entryTime", label: "エントリー時間", type: "datetime-local", defaultVisible: true, minWidth: "min-w-[180px]" },
  { id: "exitTime", label: "エグジット時間", type: "datetime-local", defaultVisible: true, minWidth: "min-w-[180px]" },
  { id: "pair", label: "シンボル", type: "select", options: [], defaultVisible: true, minWidth: "min-w-[120px]" },
  {
    id: "type",
    label: "種別",
    type: "select",
    options: ["買い", "売り"],
    defaultVisible: true,
    minWidth: "min-w-[100px]",
  },
  { id: "lot", label: "ロット", type: "number", defaultVisible: true, minWidth: "min-w-[100px]" },
  { id: "entry", label: "エントリー", type: "number", defaultVisible: true, minWidth: "min-w-[140px]" },
  { id: "exit", label: "エグジット", type: "number", defaultVisible: true, minWidth: "min-w-[140px]" },
  { id: "pips", label: "pips", type: "number", defaultVisible: true, minWidth: "min-w-[100px]" },
  { id: "profit", label: "損益 (¥)", type: "number", defaultVisible: true, minWidth: "min-w-[120px]" },
  { id: "emotion", label: "感情", type: "select", options: emotions, defaultVisible: true, minWidth: "min-w-[120px]" },
  { id: "holdingTime", label: "保有時間", type: "holdingTime", defaultVisible: true, minWidth: "min-w-[200px]" },
  { id: "notes", label: "メモ", type: "textarea", defaultVisible: true, minWidth: "min-w-[250px]" },
  { id: "tags", label: "タグ", type: "tags", defaultVisible: true, minWidth: "min-w-[200px]" },
]

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
      date: defaultDate || format(new Date(), "yyyy-MM-dd"),
      entryTime: defaultDate ? `${defaultDate}T00:00:00` : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      exitTime: defaultDate ? `${defaultDate}T00:00:00` : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      pair: "",
      type: "買い",
      lot: undefined,
      entry: undefined,
      exit: undefined,
      pips: undefined,
      profit: undefined,
      emotion: "",
      holdingTime: 0,
      notes: "",
      tags: [],
    },
  )
  const [newTag, setNewTag] = useState("")
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([])
  const [loadingSymbols, setLoadingSymbols] = useState(false)

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
    loadSymbolsFromDatabase()
  }, [user])

  useEffect(() => {
    setFormData(
      trade || {
        date: defaultDate || format(new Date(), "yyyy-MM-dd"),
        entryTime: defaultDate ? `${defaultDate}T00:00:00` : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        exitTime: defaultDate ? `${defaultDate}T00:00:00` : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        pair: "",
        type: "買い",
        lot: undefined,
        entry: undefined,
        exit: undefined,
        pips: undefined,
        profit: undefined,
        emotion: "",
        holdingTime: 0,
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
    const parsedLot = formData.lot !== undefined ? Number.parseFloat(String(formData.lot)) : undefined
    const parsedEntry = formData.entry !== undefined ? Number.parseFloat(String(formData.entry)) : undefined
    const parsedExit = formData.exit !== undefined ? Number.parseFloat(String(formData.exit)) : undefined
    const parsedPips = formData.pips !== undefined ? Number.parseFloat(String(formData.pips)) : undefined
    const parsedProfit = formData.profit !== undefined ? Number.parseFloat(String(formData.profit)) : undefined

    // Convert datetime-local format to ISO string for database
    const entryDateTime = formData.entryTime ? new Date(formData.entryTime).toISOString() : undefined
    const exitDateTime = formData.exitTime ? new Date(formData.exitTime).toISOString() : undefined

    onSave({
      ...formData,
      entryTime: entryDateTime,
      exitTime: exitDateTime,
      lot: parsedLot,
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
              <Label htmlFor="entryTime">エントリー日時</Label>
              <Input
                id="entryTime"
                type="datetime-local"
                step="1"
                value={formData.entryTime}
                onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="exitTime">エグジット日時</Label>
              <Input
                id="exitTime"
                type="datetime-local"
                step="1"
                value={formData.exitTime}
                onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pair">シンボル</Label>
              <Select
                value={formData.pair}
                onValueChange={(value) => setFormData({ ...formData, pair: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="シンボルを選択" />
                </SelectTrigger>
                <SelectContent>
                  {loadingSymbols ? (
                    <SelectItem value="" disabled>読み込み中...</SelectItem>
                  ) : availableSymbols.length > 0 ? (
                    availableSymbols.map((symbol) => (
                      <SelectItem key={symbol} value={symbol}>
                        {symbol}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>シンボルがありません</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
              <Label htmlFor="lot">ロット</Label>
              <Input
                id="lot"
                type="number"
                step="0.01"
                value={formData.lot}
                onChange={(e) => setFormData({ ...formData, lot: Number.parseFloat(e.target.value) })}
                className="no-spinner"
              />
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
                className="no-spinner"
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
                className="no-spinner"
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
                className="no-spinner"
              />
            </div>
            <div>
              <Label htmlFor="profit">損益 (¥)</Label>
              <Input
                id="profit"
                type="number"
                value={formData.profit}
                onChange={(e) => setFormData({ ...formData, profit: Number.parseFloat(e.target.value) })}
                className="no-spinner"
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
            <Label>保有時間</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label htmlFor="holdingDays" className="text-sm text-muted-foreground">日</Label>
                <Input
                  id="holdingDays"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.holdingDays || ""}
                  onChange={(e) => {
                    const days = e.target.value ? parseInt(e.target.value) : 0;
                    const hours = formData.holdingHours || 0;
                    const minutes = formData.holdingMinutes || 0;
                    const seconds = formData.holdingSeconds || 0;
                    const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                    setFormData({ 
                      ...formData, 
                      holdingDays: days || undefined,
                      holdingTime: totalSeconds
                    });
                  }}
                  placeholder="0"
                  className="no-spinner"
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
                  onChange={(e) => {
                    const days = formData.holdingDays || 0;
                    const hours = e.target.value ? parseInt(e.target.value) : 0;
                    const minutes = formData.holdingMinutes || 0;
                    const seconds = formData.holdingSeconds || 0;
                    const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                    setFormData({ 
                      ...formData, 
                      holdingHours: hours || undefined,
                      holdingTime: totalSeconds
                    });
                  }}
                  placeholder="0"
                  className="no-spinner"
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
                  onChange={(e) => {
                    const days = formData.holdingDays || 0;
                    const hours = formData.holdingHours || 0;
                    const minutes = e.target.value ? parseInt(e.target.value) : 0;
                    const seconds = formData.holdingSeconds || 0;
                    const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                    setFormData({ 
                      ...formData, 
                      holdingMinutes: minutes || undefined,
                      holdingTime: totalSeconds
                    });
                  }}
                  placeholder="0"
                  className="no-spinner"
                />
              </div>
              <div>
                <Label htmlFor="holdingSeconds" className="text-sm text-muted-foreground">秒</Label>
                <Input
                  id="holdingSeconds"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.holdingSeconds || ""}
                  onChange={(e) => {
                    const days = formData.holdingDays || 0;
                    const hours = formData.holdingHours || 0;
                    const minutes = formData.holdingMinutes || 0;
                    const seconds = e.target.value ? parseInt(e.target.value) : 0;
                    const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                    setFormData({ 
                      ...formData, 
                      holdingSeconds: seconds || undefined,
                      holdingTime: totalSeconds
                    });
                  }}
                  placeholder="0"
                  className="no-spinner"
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
  onDragStart,
  onDragOver,
  onDrop,
  onSave,
  draggedColumn,
}: {
  isOpen: boolean
  onClose: () => void
  visibleColumns: string[]
  onToggleColumn: (columnId: string, isVisible: boolean) => void
  onDragStart: (columnId: string) => void
  onDragOver: (e: React.DragEvent, columnId: string) => void
  onDrop: (targetColumnId: string) => void
  onSave: () => void
  draggedColumn: string | null
}) {
  // Define required columns that cannot be unchecked
  const requiredColumns = ['pair', 'profit'];
  
  // Ensure required columns are always visible
  const allRequiredColumns = requiredColumns.filter(col => !visibleColumns.includes(col));
  const finalVisibleColumns = [...visibleColumns, ...allRequiredColumns];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>表示設定</DialogTitle>
          <DialogDescription>テーブルに表示する列を選択し、ドラッグ＆ドロップで順序を変更してください。</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {finalVisibleColumns.map((columnId) => {
            const column = allColumns.find((c) => c.id === columnId);
            if (!column) return null;
            
            const isRequired = requiredColumns.includes(columnId);
            
            return (
              <div
                key={column.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  draggedColumn === column.id ? 'opacity-50 bg-muted' : 'bg-background'
                }`}
                draggable={true}
                onDragStart={() => onDragStart(column.id)}
                onDragOver={(e) => onDragOver(e, column.id)}
                onDrop={() => onDrop(column.id)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                <Checkbox
                  id={`col-${column.id}`}
                  checked={true}
                  disabled={isRequired}
                  onCheckedChange={(checked) => !isRequired && onToggleColumn(column.id, checked as boolean)}
                />
                <Label htmlFor={`col-${column.id}`} className="flex-1 cursor-pointer">
                  {column.label}
                  {isRequired && <span className="text-xs text-muted-foreground ml-2">(必須)</span>}
                </Label>
              </div>
            );
          })}
          
          {/* Hidden columns */}
          {allColumns
            .filter((column) => !finalVisibleColumns.includes(column.id))
            .map((column) => {
              const isRequired = requiredColumns.includes(column.id);
              
              return (
                <div key={column.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
                  <Checkbox
                    id={`col-${column.id}`}
                    checked={false}
                    disabled={isRequired}
                    onCheckedChange={(checked) => !isRequired && onToggleColumn(column.id, checked as boolean)}
                  />
                  <Label htmlFor={`col-${column.id}`} className="flex-1 cursor-pointer">
                    {column.label}
                    {isRequired && <span className="text-xs text-muted-foreground ml-2">(必須)</span>}
                  </Label>
                </div>
              );
            })}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={onSave}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function TablePage() {
  const user = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingCell, setEditingCell] = useState<{ id: number; field: keyof Trade } | null>(null);
  const [editingTrade, setEditingTrade] = useState<Partial<Trade> | null>(null);
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [isTableSettingsOpen, setIsTableSettingsOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    allColumns.filter((col) => col.defaultVisible).map((col) => col.id),
  );
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Trade | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [originalVisibleColumns, setOriginalVisibleColumns] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);

  // New state for improved cell editing
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, any>>({});
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);

  // Load symbols from database for table editing
  const loadSymbolsForTable = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("symbols")
        .select("symbol")
        .order("symbol")
      
      if (error) {
        console.error("Error loading symbols for table:", error)
        return
      }
      
      const symbols = data?.map(item => item.symbol) || []
      setAvailableSymbols(symbols)
      
      // Update the pair column options
      const updatedColumns = allColumns.map(col => {
        if (col.id === 'pair') {
          return { ...col, options: symbols }
        }
        return col
      })
      
      // Update the allColumns array (this is a bit of a workaround since allColumns is const)
      // We'll handle this in the cell rendering logic instead
    } catch (error) {
      console.error("Error loading symbols for table:", error)
    }
  }

  useEffect(() => {
    if (!user) return;
    
    // Load symbols for table editing
    loadSymbolsForTable();
    
    const loadTrades = async () => {
      setLoading(true);
      setError("");
      try {
        // Load user's column preferences first
        const { data: preferencesData, error: preferencesError } = await supabase
          .from("table_column_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (preferencesError && preferencesError.code !== 'PGRST116') {
          console.error("Error loading preferences:", preferencesError);
        }

        // Set visible columns based on preferences or defaults
        if (preferencesData) {
          const orderedColumns: string[] = [];
          const columnOrder = [
            { key: 'pair', dbField: 'symbol' },
            { key: 'entry', dbField: 'entry_price' },
            { key: 'exit', dbField: 'exit_price' },
            { key: 'entryTime', dbField: 'entry_time' },
            { key: 'exitTime', dbField: 'exit_time' },
            { key: 'type', dbField: 'type' },
            { key: 'emotion', dbField: 'emotion' },
            { key: 'tags', dbField: 'tag' },
            { key: 'lot', dbField: 'lot' },
            { key: 'pips', dbField: 'pips' },
            { key: 'profit', dbField: 'profit_loss' },
            { key: 'notes', dbField: 'note' },
            { key: 'holdingTime', dbField: 'hold_time' },
          ];

          // Sort by order values and add visible columns
          columnOrder
            .sort((a, b) => {
              const aOrder = preferencesData[a.dbField as keyof typeof preferencesData] as number;
              const bOrder = preferencesData[b.dbField as keyof typeof preferencesData] as number;
              if (aOrder === null && bOrder === null) return 0;
              if (aOrder === null) return 1;
              if (bOrder === null) return -1;
              return aOrder - bOrder;
            })
            .forEach(({ key }) => {
              const order = preferencesData[columnOrder.find(c => c.key === key)?.dbField as keyof typeof preferencesData] as number;
              if (order !== null) {
                orderedColumns.push(key);
              }
            });

          setVisibleColumns(orderedColumns);
          setOriginalVisibleColumns(orderedColumns);
        }

        // Fetch trades with symbol information
        const { data: tradesData, error: tradesError } = await supabase
          .from("trades")
          .select(`
            *,
            symbols!inner(symbol)
          `)
          .eq("user_id", user.id)
          .order("entry_time", { ascending: true });

        if (tradesError) {
          setError(tradesError.message);
          setTrades([]);
          return;
        }

        // Fetch tags for all trades
        const { data: tagLinksData, error: tagLinksError } = await supabase
          .from("trade_tag_links")
          .select(`
            trade_id,
            trade_tags!inner(tag_name)
          `);

        if (tagLinksError) {
          console.error("Error loading tags:", tagLinksError);
        }

        // Fetch emotions for all trades
        const { data: emotionLinksData, error: emotionLinksError } = await supabase
          .from("trade_emotion_links")
          .select(`
            trade_id,
            emotions!inner(emotion)
          `);

        if (emotionLinksError) {
          console.error("Error loading emotions:", emotionLinksError);
        }

        // Group tags and emotions by trade_id, but only for trades that belong to the current user
        const userTradeIds = new Set((tradesData || []).map(trade => trade.id));
        
        const tagsByTradeId = (tagLinksData || []).reduce((acc: Record<number, string[]>, link: any) => {
          // Only include tags for trades that belong to the current user
          if (userTradeIds.has(link.trade_id)) {
            if (!acc[link.trade_id]) acc[link.trade_id] = [];
            acc[link.trade_id].push(link.trade_tags.tag_name);
          }
          return acc;
        }, {});

        const emotionsByTradeId = (emotionLinksData || []).reduce((acc: Record<number, string>, link: any) => {
          // Only include emotions for trades that belong to the current user
          if (userTradeIds.has(link.trade_id)) {
            acc[link.trade_id] = link.emotions.emotion;
          }
          return acc;
        }, {});

        // Transform DB data to match Trade interface
        const transformedTrades = (tradesData || []).map((trade: any) => {
          const entryTime = new Date(trade.entry_time);
          const exitTime = new Date(trade.exit_time);
          
          // Convert UTC to local timezone
          const convertToLocalTime = (date: Date) => {
            // The Date object automatically handles timezone conversion when created from UTC
            return date;
          };
          
          const localEntryTime = convertToLocalTime(entryTime);
          const localExitTime = convertToLocalTime(exitTime);
          
          // Convert hold_time from seconds to readable format
          const formatHoldTime = (seconds: number) => {
            if (!seconds) return "";
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            
            if (hours > 0) {
              return `${hours}h ${minutes}m`;
            } else if (minutes > 0) {
              return `${minutes}m ${remainingSeconds}s`;
            } else {
              return `${remainingSeconds}s`;
            }
          };

          // Format local time properly
          const formatLocalTime = (date: Date) => {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
          };

          // Format datetime with seconds
          const formatDateTime = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          };

          return {
            id: trade.id,
            date: localEntryTime.toLocaleDateString('en-CA'), // YYYY-MM-DD format in local timezone
            time: formatLocalTime(localEntryTime),
            entryTime: formatDateTime(localEntryTime),
            exitTime: formatDateTime(localExitTime),
            pair: trade.symbols?.symbol || "",
            type: (trade.trade_type === 0 ? "買い" : "売り") as "買い" | "売り",
            lot: trade.lot_size || 0,
            entry: trade.entry_price,
            exit: trade.exit_price,
            pips: trade.pips || 0,
            profit: trade.profit_loss,
            emotion: emotionsByTradeId[trade.id] || "",
            holdingTime: trade.hold_time || 0,
            notes: trade.trade_memo || "",
            tags: tagsByTradeId[trade.id] || [],
          };
        }) as Trade[];

        setTrades(transformedTrades);
      } catch (error: any) {
        console.error("Error loading trades:", error);
        setError(error.message || "取引データの読み込み中にエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    loadTrades();
    
    // Listen for trade updates
    const handleTradeUpdate = () => {
      loadTrades();
    };
    
    window.addEventListener('tradeUpdated', handleTradeUpdate);
    
    return () => {
      window.removeEventListener('tradeUpdated', handleTradeUpdate);
    };
  }, [user]);

  // Cleanup effect to handle unsaved changes when component unmounts
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editingCell || Object.keys(editingValues).length > 0) {
        e.preventDefault();
        e.returnValue = '編集中のデータがあります。ページを離れますか？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [editingCell, editingValues]);

  const filteredTrades = useMemo(() => {
    if (!selectedDate) return [];
    const dateString = format(selectedDate, "yyyy-MM-dd");
    let filtered = trades.filter((trade) => {
      // Use exit time for filtering instead of entry time
      const exitDate = new Date(trade.exitTime);
      const exitDateString = exitDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      return exitDateString === dateString;
    });
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        // Handle different data types
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          // For profit and pips, reverse the logic so highest values appear at top when arrow is up
          if (sortConfig.key === 'profit' || sortConfig.key === 'pips') {
            return sortConfig.direction === 'asc' ? bValue - aValue : aValue - bValue;
          }
          // For other numeric fields (lot, entry, exit), use normal sorting
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          // Special handling for holding time (保有時間)
          if (sortConfig.key === 'holdingTime') {
            const parseTime = (timeStr: string) => {
              if (!timeStr) return 0;
              let totalMinutes = 0;
              
              // Parse hours
              const hourMatch = timeStr.match(/(\d+)h/);
              if (hourMatch) {
                totalMinutes += parseInt(hourMatch[1]) * 60;
              }
              
              // Parse minutes
              const minuteMatch = timeStr.match(/(\d+)m/);
              if (minuteMatch) {
                totalMinutes += parseInt(minuteMatch[1]);
              }
              
              // Parse seconds
              const secondMatch = timeStr.match(/(\d+)s/);
              if (secondMatch) {
                totalMinutes += parseInt(secondMatch[1]) / 60;
              }
              
              return totalMinutes;
            };
            
            const aMinutes = parseTime(aValue);
            const bMinutes = parseTime(bValue);
            
            // For holding time: arrow up = shortest time, arrow down = longest time
            return sortConfig.direction === 'asc' ? aMinutes - bMinutes : bMinutes - aMinutes;
          }
          
          // Regular string comparison for other string fields
          const comparison = aValue.localeCompare(bValue);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        // Handle arrays (tags)
        if (Array.isArray(aValue) && Array.isArray(bValue)) {
          const aStr = aValue.join(', ');
          const bStr = bValue.join(', ');
          const comparison = aStr.localeCompare(bStr);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        return 0;
      });
    }
    
    return filtered;
  }, [trades, selectedDate, sortConfig]);

  const handleCellClick = (id: number, field: keyof Trade) => {
    const cellKey = `${id}-${field}`;
    
    // Don't allow editing if the cell is currently being saved
    if (savingCells.has(cellKey)) {
      return;
    }
    
    // Don't allow editing of complex fields that need special handling
    if (field === 'tags' || field === 'date' || field === 'time') {
      // For these fields, open the edit dialog instead
      const trade = trades.find(t => t.id === id);
      if (trade) {
        setEditingTrade(trade);
        setIsTradeDialogOpen(true);
      }
      return;
    }
    
    const trade = trades.find(t => t.id === id);
    if (!trade) return;
    
    // Store original value for potential rollback
    setOriginalValues(prev => ({
      ...prev,
      [cellKey]: trade[field]
    }));
    
    // Initialize editing value - convert datetime fields to datetime-local format
    let editingValue = trade[field];
    if (field === 'entryTime' || field === 'exitTime') {
      editingValue = convertToDateTimeLocal(trade[field] as string);
    }
    
    // Initialize holding time fields
    if (field === 'holdingTime') {
      const totalSeconds = typeof trade[field] === 'number' ? trade[field] as number : 0;
      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;
      
      setEditingValues(prev => ({
        ...prev,
        [`${id}-holdingDays`]: days || "",
        [`${id}-holdingHours`]: hours || "",
        [`${id}-holdingMinutes`]: minutes || "",
        [`${id}-holdingSeconds`]: seconds || "",
        [cellKey]: totalSeconds
      }));
    } else {
      setEditingValues(prev => ({
        ...prev,
        [cellKey]: editingValue
      }));
    }
    
    // Clear any previous errors for this cell
    setCellErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[cellKey];
      return newErrors;
    });
    
    setEditingCell({ id, field });
  };

  const isFieldEditable = (field: keyof Trade): boolean => {
    // Fields that should not be directly edited in the table
    const nonEditableFields: (keyof Trade)[] = ['tags', 'date', 'time', 'id'];
    return !nonEditableFields.includes(field);
  };

  const handleCellChange = useCallback((id: number, field: keyof Trade, value: any) => {
    const cellKey = `${id}-${field}`;
    setEditingValues(prev => ({
      ...prev,
      [cellKey]: value
    }));
    
    // Clear error when user starts typing
    setCellErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[cellKey];
      return newErrors;
    });
  }, []);

  const validateCellValue = (field: keyof Trade, value: any): { isValid: boolean; error?: string } => {
    // Basic validation rules
    if (field === 'lot' || field === 'entry' || field === 'exit' || field === 'pips' || field === 'profit') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { isValid: false, error: '数値を入力してください' };
      }
      if (field === 'lot' && numValue <= 0) {
        return { isValid: false, error: 'ロットは0より大きい値を入力してください' };
      }
      if ((field === 'entry' || field === 'exit') && numValue <= 0) {
        return { isValid: false, error: '価格は0より大きい値を入力してください' };
      }
    }
    
    if (field === 'pair' && !value?.trim()) {
      return { isValid: false, error: 'シンボルを入力してください' };
    }
    
    if (field === 'type' && !['買い', '売り'].includes(value)) {
      return { isValid: false, error: '有効な取引種別を選択してください' };
    }
    
    return { isValid: true };
  };

  const mapFieldToDatabase = (field: keyof Trade, value: any) => {
    // Map frontend field names to database column names
    const fieldMapping: Record<keyof Trade, string> = {
      id: 'id',
      date: 'entry_time',
      time: 'entry_time',
      entryTime: 'entry_time',
      exitTime: 'exit_time',
      pair: 'symbol',
      type: 'trade_type',
      lot: 'lot_size',
      entry: 'entry_price',
      exit: 'exit_price',
      pips: 'pips',
      profit: 'profit_loss',
      emotion: 'emotion',
      holdingTime: 'hold_time',
      holdingDays: 'hold_time',
      holdingHours: 'hold_time',
      holdingMinutes: 'hold_time',
      holdingSeconds: 'hold_time',
      notes: 'trade_memo',
      tags: 'tags'
    };
    
    const dbField = fieldMapping[field];
    
    // Transform values for database
    if (field === 'type') {
      return { field: dbField, value: value === '買い' ? 0 : 1 };
    }
    
    if (field === 'entryTime' || field === 'exitTime') {
      // For datetime fields, value should already be in ISO format
      return { field: dbField, value };
    }
    
    if (field === 'date' || field === 'time') {
      // Handle date/time updates - this is complex and might need special handling
      return { field: dbField, value, needsSpecialHandling: true };
    }
    
    return { field: dbField, value };
  };

  const handleCellSave = useCallback(async (id: number, field: keyof Trade) => {
    const cellKey = `${id}-${field}`;
    let value = editingValues[cellKey];
    
    if (value === undefined) return;
    
    // Convert datetime-local format back to ISO string for datetime fields
    if (field === 'entryTime' || field === 'exitTime') {
      value = convertFromDateTimeLocal(value as string);
    }
    
    // Validate the value
    const validation = validateCellValue(field, value);
    if (!validation.isValid) {
      setCellErrors(prev => ({
        ...prev,
        [cellKey]: validation.error!
      }));
      return;
    }
    
    // Check if value actually changed
    const originalValue = originalValues[cellKey];
    if (value === originalValue) {
      setEditingCell(null);
      return;
    }
    
    setSavingCells(prev => new Set(prev).add(cellKey));
    
    try {
      // Handle special cases that need complex updates
      if (field === 'tags' || field === 'emotion') {
        await handleSpecialFieldUpdate(id, field, value);
      } else if (field === 'pair') {
        await handleSymbolUpdate(id, value);
      } else {
        // Handle regular field updates
        const { field: dbField, value: dbValue } = mapFieldToDatabase(field, value);
        
        const { error } = await supabase
          .from("trades")
          .update({ [dbField]: dbValue, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user!.id);
        
        if (error) throw error;
      }
      
      // Update local state - convert back to display format for datetime fields
      let displayValue = value;
      if (field === 'entryTime' || field === 'exitTime') {
        // Format the datetime for display
        const date = new Date(value as string);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        displayValue = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      
      setTrades(prevTrades => 
        prevTrades.map(trade => 
          trade.id === id ? { ...trade, [field]: displayValue } : trade
        )
      );
      
      // Clear editing state
      setEditingCell(null);
      setEditingValues(prev => {
        const newValues = { ...prev };
        delete newValues[cellKey];
        return newValues;
      });
      setOriginalValues(prev => {
        const newValues = { ...prev };
        delete newValues[cellKey];
        return newValues;
      });
      
    } catch (error: any) {
      console.error("Error updating cell:", error);
      setCellErrors(prev => ({
        ...prev,
        [cellKey]: error.message || '更新に失敗しました'
      }));
    } finally {
      setSavingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  }, [editingValues, originalValues, user]);

  const handleSpecialFieldUpdate = async (id: number, field: keyof Trade, value: any) => {
    if (field === 'tags') {
      // Delete existing tags
      await supabase
        .from("trade_tag_links")
        .delete()
        .eq("trade_id", id);
      
      // Add new tags
      if (Array.isArray(value) && value.length > 0) {
        for (const tagName of value) {
          // Get or create tag
          let { data: tagData, error: tagError } = await supabase
            .from("trade_tags")
            .select("id")
            .eq("tag_name", tagName)
            .eq("user_id", user!.id)
            .single();
          
          let tagId = null;
          if (tagError && tagError.code === 'PGRST116') {
            // Tag doesn't exist, create it
            const { data: newTag, error: createTagError } = await supabase
              .from("trade_tags")
              .insert([{ tag_name: tagName, user_id: user!.id }])
              .select()
              .single();
            
            if (createTagError) {
              console.error("Error creating tag:", createTagError);
              continue;
            }
            tagId = newTag.id;
          } else if (tagError) {
            console.error("Error finding tag:", tagError);
            continue;
          } else if (tagData) {
            tagId = tagData.id;
          }
          
          // Create link
          await supabase
            .from("trade_tag_links")
            .insert([{ trade_id: id, tag_id: tagId }]);
        }
      }
    } else if (field === 'emotion') {
      // Delete existing emotion
      await supabase
        .from("trade_emotion_links")
        .delete()
        .eq("trade_id", id);
      
      if (value) {
        // Get or create emotion
        let { data: emotionData, error: emotionError } = await supabase
          .from("emotions")
          .select("id")
          .eq("emotion", value)
          .eq("user_id", user!.id)
          .single();
        
        let emotionId = null;
        if (emotionError && emotionError.code === 'PGRST116') {
          // Emotion doesn't exist, create it
          const { data: newEmotion, error: createEmotionError } = await supabase
            .from("emotions")
            .insert([{ emotion: value, user_id: user!.id }])
            .select()
            .single();
          
          if (createEmotionError) {
            console.error("Error creating emotion:", createEmotionError);
            throw createEmotionError;
          }
          emotionId = newEmotion.id;
        } else if (emotionError) {
          console.error("Error finding emotion:", emotionError);
          throw emotionError;
        } else if (emotionData) {
          emotionId = emotionData.id;
        }
        
        if (emotionId) {
          // Create link
          await supabase
            .from("trade_emotion_links")
            .insert([{ trade_id: id, emotion_id: emotionId }]);
        }
      }
    }
  };

  const handleSymbolUpdate = async (id: number, symbolName: string) => {
    // Get or create symbol ID
    let symbolId = null;
    if (symbolName) {
      // First try to find existing symbol
      let { data: symbolData, error: symbolError } = await supabase
        .from("symbols")
        .select("id")
        .eq("symbol", symbolName)
        .single();
      
      if (symbolError && symbolError.code === 'PGRST116') {
        // Symbol doesn't exist, create it
        const { data: newSymbol, error: createError } = await supabase
          .from("symbols")
          .insert([{ symbol: symbolName }])
          .select()
          .single();
        
        if (createError) {
          console.error("Error creating symbol:", createError);
          throw createError;
        }
        symbolId = newSymbol.id;
      } else if (symbolError) {
        console.error("Error finding symbol:", symbolError);
        throw symbolError;
      } else if (symbolData) {
        symbolId = symbolData.id;
      }
    }

    // Update trade with new symbol
    const { error } = await supabase
      .from("trades")
      .update({ 
        symbol: symbolId, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", id)
      .eq("user_id", user!.id);
    
    if (error) throw error;
  };

  const handleCellBlur = useCallback(() => {
    if (editingCell) {
      handleCellSave(editingCell.id, editingCell.field);
    }
  }, [editingCell, handleCellSave]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, id: number, field: keyof Trade) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave(id, field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Cancel editing and restore original value
      const cellKey = `${id}-${field}`;
      let originalValue = originalValues[cellKey];
      
      // Convert datetime fields back to datetime-local format for display
      if (field === 'entryTime' || field === 'exitTime') {
        originalValue = convertToDateTimeLocal(originalValue as string);
      }
      
      setEditingValues(prev => ({
        ...prev,
        [cellKey]: originalValue
      }));
      setCellErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[cellKey];
        return newErrors;
      });
      setEditingCell(null);
    }
  }, [handleCellSave, originalValues]);

  const handleAddTrade = () => {
    setEditingTrade(null);
    setIsTradeDialogOpen(true);
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsTradeDialogOpen(true);
  };

  const handleSaveTrade = async (tradeData: Partial<Trade>) => {
    if (!user) return;
    
    try {
      // Get or create symbol ID
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
          const { data: newSymbol, error: createError } = await supabase
            .from("symbols")
            .insert([{ symbol: tradeData.pair }])
            .select()
            .single();
          
          if (createError) {
            console.error("Error creating symbol:", createError);
            throw createError;
          }
          symbolId = newSymbol.id;
        } else if (symbolError) {
          console.error("Error finding symbol:", symbolError);
          throw symbolError;
        } else if (symbolData) {
          symbolId = symbolData.id;
        }
      }

      if (editingTrade?.id) {
        // Update existing trade
        const { error } = await supabase
          .from("trades")
          .update({
            symbol: symbolId,
            trade_type: tradeData.type === "買い" ? 0 : 1,
            lot_size: tradeData.lot,
            entry_price: tradeData.entry,
            exit_price: tradeData.exit,
            pips: tradeData.pips,
            profit_loss: tradeData.profit,
            trade_memo: tradeData.notes,
            entry_time: tradeData.entryTime,
            exit_time: tradeData.exitTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTrade.id)
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        // Update tags
        if (tradeData.tags) {
          // Delete existing tags
          await supabase
            .from("trade_tag_links")
            .delete()
            .eq("trade_id", editingTrade.id);
          
          // Add new tags
          for (const tagName of tradeData.tags) {
            // Get or create tag
            let { data: tagData, error: tagError } = await supabase
              .from("trade_tags")
              .select("id")
              .eq("tag_name", tagName)
              .eq("user_id", user.id)
              .single();
            
            let tagId = null;
            if (tagError && tagError.code === 'PGRST116') {
              // Tag doesn't exist, create it
              const { data: newTag, error: createTagError } = await supabase
                .from("trade_tags")
                .insert([{ tag_name: tagName, user_id: user.id }])
                .select()
                .single();
              
              if (createTagError) {
                console.error("Error creating tag:", createTagError);
                continue;
              }
              tagId = newTag.id;
            } else if (tagError) {
              console.error("Error finding tag:", tagError);
              continue;
            } else if (tagData) {
              tagId = tagData.id;
            }
            
            // Create link
            await supabase
              .from("trade_tag_links")
              .insert([{ trade_id: editingTrade.id, tag_id: tagId }]);
          }
        }
        
        // Update emotion
        if (tradeData.emotion) {
          // Delete existing emotion
          await supabase
            .from("trade_emotion_links")
            .delete()
            .eq("trade_id", editingTrade.id);
          
          // Get or create emotion
          let { data: emotionData, error: emotionError } = await supabase
            .from("emotions")
            .select("id")
            .eq("emotion", tradeData.emotion)
            .eq("user_id", user.id)
            .single();
          
          let emotionId = null;
          if (emotionError && emotionError.code === 'PGRST116') {
            // Emotion doesn't exist, create it
            const { data: newEmotion, error: createEmotionError } = await supabase
              .from("emotions")
              .insert([{ emotion: tradeData.emotion, user_id: user.id }])
              .select()
              .single();
            
            if (createEmotionError) {
              console.error("Error creating emotion:", createEmotionError);
            } else {
              emotionId = newEmotion.id;
            }
                      } else if (emotionError) {
              console.error("Error finding emotion:", emotionError);
            } else if (emotionData) {
              emotionId = emotionData.id;
            }
          
          if (emotionId) {
            // Create link
            await supabase
              .from("trade_emotion_links")
              .insert([{ trade_id: editingTrade.id, emotion_id: emotionId }]);
          }
        }
        
        // Refresh the data
        const event = new Event('tradeUpdated');
        window.dispatchEvent(event);
        
      } else {
        // Add new trade
        const entryDateTime = tradeData.entryTime || new Date().toISOString();
        const exitDateTime = tradeData.exitTime || new Date().toISOString();
        
        const { data, error } = await supabase
          .from("trades")
          .insert([{
            user_id: user.id,
            symbol: symbolId,
            trade_type: tradeData.type === "買い" ? 0 : 1,
            lot_size: tradeData.lot,
            entry_price: tradeData.entry,
            exit_price: tradeData.exit,
            pips: tradeData.pips,
            profit_loss: tradeData.profit,
            trade_memo: tradeData.notes,
            entry_time: entryDateTime,
            exit_time: exitDateTime,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
          const newTradeId = data[0].id;
          
          // Add tags
          if (tradeData.tags) {
            for (const tagName of tradeData.tags) {
              // Get or create tag
              let { data: tagData, error: tagError } = await supabase
                .from("trade_tags")
                .select("id")
                .eq("tag_name", tagName)
                .eq("user_id", user.id)
                .single();
              
              let tagId = null;
              if (tagError && tagError.code === 'PGRST116') {
                // Tag doesn't exist, create it
                const { data: newTag, error: createTagError } = await supabase
                  .from("trade_tags")
                  .insert([{ tag_name: tagName, user_id: user.id }])
                  .select()
                  .single();
                
                if (createTagError) {
                  console.error("Error creating tag:", createTagError);
                  continue;
                }
                tagId = newTag.id;
              } else if (tagError) {
                console.error("Error finding tag:", tagError);
                continue;
              } else if (tagData) {
                tagId = tagData.id;
              }
              
              // Create link
              await supabase
                .from("trade_tag_links")
                .insert([{ trade_id: newTradeId, tag_id: tagId }]);
            }
          }
          
          // Add emotion
          if (tradeData.emotion) {
            // Get or create emotion
            let { data: emotionData, error: emotionError } = await supabase
              .from("emotions")
              .select("id")
              .eq("emotion", tradeData.emotion)
              .eq("user_id", user.id)
              .single();
            
            let emotionId = null;
            if (emotionError && emotionError.code === 'PGRST116') {
              // Emotion doesn't exist, create it
              const { data: newEmotion, error: createEmotionError } = await supabase
                .from("emotions")
                .insert([{ emotion: tradeData.emotion, user_id: user.id }])
                .select()
                .single();
              
              if (createEmotionError) {
                console.error("Error creating emotion:", createEmotionError);
              } else {
                emotionId = newEmotion.id;
              }
            } else if (emotionError) {
              console.error("Error finding emotion:", emotionError);
            } else if (emotionData) {
              emotionId = emotionData.id;
            }
            
            if (emotionId) {
              // Create link
              await supabase
                .from("trade_emotion_links")
                .insert([{ trade_id: newTradeId, emotion_id: emotionId }]);
            }
          }
          
          // Refresh the data
          const event = new Event('tradeUpdated');
          window.dispatchEvent(event);
        }
      }
      setIsTradeDialogOpen(false);
      setEditingTrade(null);
    } catch (error: any) {
      console.error("Error saving trade:", error);
      setError(error.message);
    }
  };

  const handleSelectTrade = (id: number, checked: boolean) => {
    setSelectedTrades(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAllTrades = (checked: boolean) => {
    if (checked) {
      setSelectedTrades(new Set(filteredTrades.map(trade => trade.id)));
    } else {
      setSelectedTrades(new Set());
    }
  };

  const handleDeleteSelectedTrades = () => {
    setDeleteConfirmId(-1); // Use -1 to indicate bulk delete
  };

  const handleDeleteTrade = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId || !user) return;
    
    try {
      if (deleteConfirmId === -1) {
        // Bulk delete selected trades
        const selectedIds = Array.from(selectedTrades);
        if (selectedIds.length === 0) return;
        
        const { error } = await supabase
          .from("trades")
          .delete()
          .in("id", selectedIds)
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        setTrades((prevTrades) => prevTrades.filter((t) => !selectedIds.includes(t.id)));
        setSelectedTrades(new Set());
      } else {
        // Single trade delete
        const { error } = await supabase
          .from("trades")
          .delete()
          .eq("id", deleteConfirmId)
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        setTrades((prevTrades) => prevTrades.filter((t) => t.id !== deleteConfirmId));
      }
      
      setDeleteConfirmId(null);
    } catch (error: any) {
      console.error("Error deleting trade:", error);
      setError(error.message);
    }
  };

  const handleToggleColumn = (columnId: string, isVisible: boolean) => {
    setVisibleColumns((prev) => (isVisible ? [...prev, columnId] : prev.filter((id) => id !== columnId)));
    setHasUnsavedChanges(true);
  };

  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      return;
    }

    const newOrder = [...visibleColumns];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumnId);

    // Remove dragged item from its current position
    newOrder.splice(draggedIndex, 1);
    // Insert it at the target position
    newOrder.splice(targetIndex, 0, draggedColumn);

    setVisibleColumns(newOrder);
    setDraggedColumn(null);
    setHasUnsavedChanges(true);
  };

  const saveColumnPreferences = async () => {
    if (!user) return;

    try {
      const columnMapping = {
        'pair': 'symbol',
        'entryTime': 'entry_time',
        'exitTime': 'exit_time',
        'type': 'type',
        'lot': 'lot',
        'entry': 'entry_price',
        'exit': 'exit_price',
        'pips': 'pips',
        'profit': 'profit_loss',
        'emotion': 'emotion',
        'holdingTime': 'hold_time',
        'notes': 'note',
        'tags': 'tag',
      };

      const preferences: any = {};
      
      // Set order for visible columns (1-based indexing to match database)
      visibleColumns.forEach((columnId, index) => {
        const dbField = columnMapping[columnId as keyof typeof columnMapping];
        if (dbField) {
          preferences[dbField] = index + 1; // Convert 0-based to 1-based
        }
      });

      // Set null for hidden columns
      allColumns.forEach((column) => {
        const dbField = columnMapping[column.id as keyof typeof columnMapping];
        if (dbField && !visibleColumns.includes(column.id)) {
          preferences[dbField] = null;
        }
      });

      // Check if preferences exist
      const { data: existingPrefs } = await supabase
        .from("table_column_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingPrefs) {
        // Update existing preferences
        await supabase
          .from("table_column_preferences")
          .update({
            ...preferences,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        // Create new preferences
        await supabase
          .from("table_column_preferences")
          .insert([{
            user_id: user.id,
            ...preferences,
          }]);
      }
      
      setHasUnsavedChanges(false);
      setIsTableSettingsOpen(false);
    } catch (error) {
      console.error("Error saving column preferences:", error);
    }
  };

  const handleCloseSettings = () => {
    if (hasUnsavedChanges) {
      setShowDiscardWarning(true);
    } else {
      setIsTableSettingsOpen(false);
    }
  };

  const handleDiscardChanges = () => {
    setVisibleColumns(originalVisibleColumns);
    setHasUnsavedChanges(false);
    setShowDiscardWarning(false);
    setIsTableSettingsOpen(false);
  };

  const handleCancelDiscard = () => {
    setShowDiscardWarning(false);
  };

  const handleSort = (key: keyof Trade) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        // If clicking the same column, cycle through: asc -> desc -> none
        if (prev.direction === 'asc') {
          return {
            key,
            direction: 'desc'
          };
        } else if (prev.direction === 'desc') {
          return {
            key: null,
            direction: 'asc'
          };
        }
      }
      // If clicking a different column, set it as the new sort key with ascending direction
      return {
        key,
        direction: 'asc'
      };
    });
  };

  const getSortIcon = (columnId: string) => {
    if (sortConfig.key !== columnId) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  const handlePreviousDay = () => {
    if (selectedDate) {
      const previousDay = new Date(selectedDate);
      previousDay.setDate(previousDay.getDate() - 1);
      setSelectedDate(previousDay);
    }
  };

  const handleNextDay = () => {
    if (selectedDate) {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedDate(nextDay);
    }
  };

  const getColumnValue = (trade: Trade, columnId: string) => {
    const column = allColumns.find((c) => c.id === columnId);
    if (!column) return "";

    const value = trade[column.id as keyof Trade];

    if (column.id === "profit" && typeof value === "number") {
      return `¥${value.toLocaleString()}`;
    }
    if (column.id === "pips" && typeof value === "number") {
      return `${value} pips`;
    }
    if (column.id === "holdingTime" && typeof value === "number") {
      const totalSeconds = value;
      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;
      
      let result = "";
      if (days > 0) result += `${days}日`;
      if (hours > 0) result += `${hours}時間`;
      if (minutes > 0) result += `${minutes}分`;
      if (seconds > 0) result += `${seconds}秒`;
      
      return result || "0秒";
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
      );
    }
    return String(value);
  };

  // Helper function to convert datetime string to datetime-local format
  const convertToDateTimeLocal = (dateTimeString: string): string => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "";
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Helper function to convert datetime-local format to ISO string
  const convertFromDateTimeLocal = (dateTimeLocalString: string): string => {
    if (!dateTimeLocalString) return "";
    const date = new Date(dateTimeLocalString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString();
  };

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

        <main className="flex-1 p-4 md:p-6 w-full max-w-[calc(100vw-350px)] overflow-hidden responsive-main">
          {loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-10">{error}</div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                {/* Date Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousDay}
                    disabled={!selectedDate}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
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
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextDay}
                    disabled={!selectedDate}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleAddTrade}>
                    <Plus className="mr-2 h-4 w-4" />
                    取引を追加
                  </Button>
                  {selectedTrades.size > 0 && (
                    <Button variant="destructive" onClick={handleDeleteSelectedTrades}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {selectedTrades.size}件削除
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => {
                    setOriginalVisibleColumns(visibleColumns);
                    setHasUnsavedChanges(false);
                    setIsTableSettingsOpen(true);
                  }}>
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">設定</span>
                  </Button>
                </div>
              </div>

              {/* Trade History Table */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>
                    {selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"} の取引
                  </CardTitle>
                  <CardDescription>{filteredTrades.length}件の取引が見つかりました</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto">
                    <Table className="w-full">
                      <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow>
                          <TableHead className="min-w-[50px] text-center">
                            <Checkbox
                              checked={filteredTrades.length > 0 && selectedTrades.size === filteredTrades.length}
                              onCheckedChange={handleSelectAllTrades}
                            />
                          </TableHead>
                          {visibleColumns.map((colId) => {
                            const column = allColumns.find((c) => c.id === colId);
                            return column ? (
                              <TableHead 
                                key={column.id} 
                                className={`${column.minWidth} text-left cursor-pointer hover:bg-muted/50 transition-colors`}
                                onClick={() => handleSort(column.id as keyof Trade)}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{column.label}</span>
                                  {getSortIcon(column.id)}
                                </div>
                              </TableHead>
                            ) : null;
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTrades.length > 0 ? (
                          filteredTrades.map((trade) => (
                            <TableRow key={trade.id}>
                              <TableCell className="py-2 px-4 border-b text-center min-w-[50px]">
                                <Checkbox
                                  checked={selectedTrades.has(trade.id)}
                                  onCheckedChange={(checked) => handleSelectTrade(trade.id, checked as boolean)}
                                />
                              </TableCell>
                              {visibleColumns.map((colId) => {
                                const column = allColumns.find((c) => c.id === colId);
                                if (!column) return null;

                                const isEditing = editingCell?.id === trade.id && editingCell.field === column.id;
                                const cellKey = `${trade.id}-${column.id}`;
                                const editingValue = editingValues[cellKey];
                                const isSaving = savingCells.has(cellKey);
                                const cellError = cellErrors[cellKey];
                                const value = isEditing && editingValue !== undefined ? editingValue : trade[column.id as keyof Trade];

                                return (
                                  <TableCell
                                    key={column.id}
                                    onClick={() => handleCellClick(trade.id, column.id as keyof Trade)}
                                    className={cn(
                                      `py-2 px-4 border-b border-r last:border-r-0 ${column.minWidth} text-left relative`,
                                      isFieldEditable(column.id as keyof Trade) && !isSaving
                                        ? "cursor-pointer hover:bg-muted/50" 
                                        : "cursor-default",
                                      isSaving && "opacity-50"
                                    )}
                                  >
                                                                        {isEditing ? (
                                      <div className="space-y-1">
                                        {column.type === "select" ? (
                                          <Select
                                            value={String(value)}
                                            onValueChange={(val) => handleCellChange(trade.id, column.id as keyof Trade, val)}
                                            onOpenChange={(open) => !open && handleCellBlur()}
                                          >
                                            <SelectTrigger className="h-8">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {column.id === "pair" ? (
                                                // For pair field, use symbols from database
                                                availableSymbols.length > 0 ? (
                                                  availableSymbols.map((symbol) => (
                                                    <SelectItem key={symbol} value={symbol}>
                                                      {symbol}
                                                    </SelectItem>
                                                  ))
                                                ) : (
                                                  <SelectItem value="" disabled>読み込み中...</SelectItem>
                                                )
                                              ) : (
                                                // For other select fields, use column options
                                                (column.options || []).map((option) => (
                                                  <SelectItem key={option} value={option}>
                                                    {option}
                                                  </SelectItem>
                                                ))
                                              )}
                                            </SelectContent>
                                          </Select>
                                        ) : column.type === "textarea" ? (
                                          <Textarea
                                            value={String(value)}
                                            onChange={(e) =>
                                              handleCellChange(trade.id, column.id as keyof Trade, e.target.value)
                                            }
                                            onBlur={handleCellBlur}
                                            onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                            autoFocus
                                            rows={2}
                                            className="min-w-[150px]"
                                          />
                                        ) : column.id === "entryTime" || column.id === "exitTime" ? (
                                          <Input
                                            type="datetime-local"
                                            step="1"
                                            value={String(value)}
                                            onChange={(e) =>
                                              handleCellChange(trade.id, column.id as keyof Trade, e.target.value)
                                            }
                                            onBlur={handleCellBlur}
                                            onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                            autoFocus
                                            className="h-8"
                                            disabled={isSaving}
                                          />
                                        ) : column.id === "holdingTime" ? (
                                          <div className="flex gap-1">
                                            <Input
                                              type="number"
                                              min="0"
                                              max="365"
                                              placeholder="日"
                                              value={editingValues[`${trade.id}-holdingDays`] || ""}
                                              onChange={(e) => {
                                                const days = e.target.value ? parseInt(e.target.value) : 0;
                                                const hours = editingValues[`${trade.id}-holdingHours`] || 0;
                                                const minutes = editingValues[`${trade.id}-holdingMinutes`] || 0;
                                                const seconds = editingValues[`${trade.id}-holdingSeconds`] || 0;
                                                const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                                                handleCellChange(trade.id, column.id as keyof Trade, totalSeconds);
                                              }}
                                              onBlur={handleCellBlur}
                                              onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                              className="w-12 h-8 text-xs no-spinner"
                                              disabled={isSaving}
                                            />
                                            <Input
                                              type="number"
                                              min="0"
                                              max="23"
                                              placeholder="時"
                                              value={editingValues[`${trade.id}-holdingHours`] || ""}
                                              onChange={(e) => {
                                                const days = editingValues[`${trade.id}-holdingDays`] || 0;
                                                const hours = e.target.value ? parseInt(e.target.value) : 0;
                                                const minutes = editingValues[`${trade.id}-holdingMinutes`] || 0;
                                                const seconds = editingValues[`${trade.id}-holdingSeconds`] || 0;
                                                const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                                                handleCellChange(trade.id, column.id as keyof Trade, totalSeconds);
                                              }}
                                              onBlur={handleCellBlur}
                                              onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                              className="w-12 h-8 text-xs no-spinner"
                                              disabled={isSaving}
                                            />
                                            <Input
                                              type="number"
                                              min="0"
                                              max="59"
                                              placeholder="分"
                                              value={editingValues[`${trade.id}-holdingMinutes`] || ""}
                                              onChange={(e) => {
                                                const days = editingValues[`${trade.id}-holdingDays`] || 0;
                                                const hours = editingValues[`${trade.id}-holdingHours`] || 0;
                                                const minutes = e.target.value ? parseInt(e.target.value) : 0;
                                                const seconds = editingValues[`${trade.id}-holdingSeconds`] || 0;
                                                const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                                                handleCellChange(trade.id, column.id as keyof Trade, totalSeconds);
                                              }}
                                              onBlur={handleCellBlur}
                                              onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                              className="w-12 h-8 text-xs no-spinner"
                                              disabled={isSaving}
                                            />
                                            <Input
                                              type="number"
                                              min="0"
                                              max="59"
                                              placeholder="秒"
                                              value={editingValues[`${trade.id}-holdingSeconds`] || ""}
                                              onChange={(e) => {
                                                const days = editingValues[`${trade.id}-holdingDays`] || 0;
                                                const hours = editingValues[`${trade.id}-holdingHours`] || 0;
                                                const minutes = editingValues[`${trade.id}-holdingMinutes`] || 0;
                                                const seconds = e.target.value ? parseInt(e.target.value) : 0;
                                                const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                                                handleCellChange(trade.id, column.id as keyof Trade, totalSeconds);
                                              }}
                                              onBlur={handleCellBlur}
                                              onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                              className="w-12 h-8 text-xs no-spinner"
                                              disabled={isSaving}
                                            />
                                          </div>
                                        ) : (
                                          <Input
                                            type={
                                              column.type === "number"
                                                ? "number"
                                                : column.type === "date"
                                                  ? "date"
                                                  : column.type === "time"
                                                    ? "time"
                                                    : column.type === "datetime-local"
                                                      ? "datetime-local"
                                                      : "text"
                                            }
                                            step={
                                              column.type === "number"
                                                ? column.id === "entry" || column.id === "exit"
                                                  ? "0.0001"
                                                  : "0.1"
                                                : column.type === "datetime-local"
                                                  ? "1"
                                                  : undefined
                                            }
                                            value={String(value)}
                                            onChange={(e) =>
                                              handleCellChange(trade.id, column.id as keyof Trade, e.target.value)
                                            }
                                            onBlur={handleCellBlur}
                                            onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                            autoFocus
                                            className={cn(
                                              "h-8",
                                              (column.id === "profit" || column.id === "lot" || column.id === "entry" || column.id === "exit" || column.id === "pips") && "no-spinner"
                                            )}
                                            disabled={isSaving}
                                          />
                                        )}
                                        {isSaving && (
                                          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                          </div>
                                        )}
                                        {cellError && (
                                          <div className="text-xs text-red-500 mt-1">{cellError}</div>
                                        )}
                                      </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
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
                                              "block min-h-[24px] py-1 flex-1",
                                            )}
                                          >
                                            {getColumnValue(trade, column.id)}
                                          </span>
                                          {!isFieldEditable(column.id as keyof Trade) && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Edit className="h-3 w-3 text-muted-foreground opacity-50" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>編集するには取引編集ダイアログを使用してください</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                      )}
                                  </TableCell>
                                );
                              })}
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
            </>
          )}
        </main>

        {/* Modals */}
        <TradeEditDialog
          trade={editingTrade}
          isOpen={isTradeDialogOpen}
          onClose={() => setIsTradeDialogOpen(false)}
          onSave={handleSaveTrade}
          defaultDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
          user={user}
        />

        <TableSettingsDialog
          isOpen={isTableSettingsOpen}
          onClose={handleCloseSettings}
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onSave={saveColumnPreferences}
          draggedColumn={draggedColumn}
        />

        <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteConfirmId === -1 ? "選択された取引を削除しますか？" : "取引を削除しますか？"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteConfirmId === -1 
                  ? `${selectedTrades.size}件の取引を削除します。この操作は取り消すことができません。`
                  : "この操作は取り消すことができません。取引データが完全に削除されます。"
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>削除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDiscardWarning} onOpenChange={setShowDiscardWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                保存されていない変更があります。変更を破棄すると、元の設定に戻ります。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDiscard}>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleDiscardChanges} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                破棄
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
