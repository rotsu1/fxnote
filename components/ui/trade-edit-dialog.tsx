"use client"

import {
    Plus,
    Edit,
    Tag,
  } from "lucide-react"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea"
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
import { Trade } from "@/utils/types"



export function TradeEditDialog({
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
    availableTags: { id: number, tag_name: string }[]
  }) {
    const [showDiscardWarning, setShowDiscardWarning] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Create datetime strings helpers
    const ensureTimeWithSeconds = (t: string) => {
      if (!t) return "";
      const [hh = "00", mm = "00", ss] = t.split(":");
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String((ss ?? "00")).padStart(2, "0")}`;
    };
    
    const defaultDateStr = defaultDate || new Date().toISOString().split("T")[0];

    type TradeForm = Partial<Trade> & {
      entryDate: string;
      entryTime: string; // HH:mm or HH:mm:ss
      exitDate: string;
      exitTime: string;  // HH:mm or HH:mm:ss
    };
    
    const [formData, setFormData] = useState<TradeForm>(
      trade
        ? {
            ...trade,
            entryDate: trade.entryTime ? (trade.entryTime.split("T")[0] || "") : defaultDateStr,
            entryTime: trade.entryTime ? (trade.entryTime.split("T")[1] || "") : "",
            exitDate: trade.exitTime ? (trade.exitTime.split("T")[0] || "") : defaultDateStr,
            exitTime: trade.exitTime ? (trade.exitTime.split("T")[1] || "") : "",
          }
        : {
            date: defaultDateStr,
            time: "",
            entryDate: defaultDateStr,
            entryTime: "",
            exitDate: defaultDateStr,
            exitTime: "",
            pair: "",
            type: "買い",
            entry: undefined,
            exit: undefined,
            lot: undefined,
            pips: undefined,
            profit: undefined,
            emotion: [],
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
    const [availableTagsList, setAvailableTagsList] = useState<string[]>([])
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
      const defaultDateStrLocal = defaultDate || new Date().toISOString().split("T")[0];
      
      const newFormData: TradeForm = trade
        ? {
            ...trade,
            entryDate: trade.entryTime ? (trade.entryTime.split("T")[0] || "") : defaultDateStrLocal,
            entryTime: trade.entryTime ? (trade.entryTime.split("T")[1] || "") : "",
            exitDate: trade.exitTime ? (trade.exitTime.split("T")[0] || "") : defaultDateStrLocal,
            exitTime: trade.exitTime ? (trade.exitTime.split("T")[1] || "") : "",
          }
        : {
            date: defaultDateStrLocal,
            time: "",
            entryDate: defaultDateStrLocal,
            entryTime: "",
            exitDate: defaultDateStrLocal,
            exitTime: "",
            pair: "",
            type: "買い",
            entry: undefined,
            exit: undefined,
            lot: undefined,
            pips: undefined,
            profit: undefined,
            emotion: [],
            holdingTime: 0,
            holdingDays: 0,
            holdingHours: 0,
            holdingMinutes: 0,
            holdingSeconds: 0,
            notes: "",
            tags: [],
          };

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
        setAvailableTagsList(tags)
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
  
    // Auto-calculate holding time when entry and exit times change (only when both are present)
    useEffect(() => {
      if (formData.entryDate && formData.entryTime && formData.exitDate && formData.exitTime) {
        const entryDateObj = new Date(`${formData.entryDate}T${ensureTimeWithSeconds(formData.entryTime)}`);
        const exitDateObj = new Date(`${formData.exitDate}T${ensureTimeWithSeconds(formData.exitTime)}`);
        
        const diffMs = exitDateObj.getTime() - entryDateObj.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        setFormData(prev => ({
          ...prev,
          holdingDays: diffDays,
          holdingHours: diffHours,
          holdingMinutes: diffMinutes,
          holdingSeconds: diffSeconds
        }));
      }
    }, [formData.entryDate, formData.entryTime, formData.exitDate, formData.exitTime])
  
    const addNewTagToDatabase = async (tagName: string) => {
      if (!tagName.trim() || !user) return
      
      const trimmedTagName = tagName.trim()
      
      // Check if tag already exists
      if (availableTagsList.includes(trimmedTagName)) {
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
        setAvailableTagsList(prev => [...prev, trimmedTagName])
        setNewTag("")
        
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
        setAvailableTagsList(prev => prev.filter(tag => tag !== tagToDelete))
        
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
  
    const handleFormChange = (updates: Partial<TradeForm>) => {
      setFormData(prev => ({ ...prev, ...updates }));
      setHasUnsavedChanges(true);
    };
  
    const handleSave = () => {
      // Clear previous validation errors
      setValidationError("")
      
      // Validation: Check if required fields are filled
      if (!formData.pair || !formData.pair.trim()) {
        setValidationError("シンボルを選択してください")
        return
      }
      
      if (formData.profit === undefined || formData.profit === null) {
        setValidationError("損益を入力してください")
        return
      }
      
      // Additional validation: Check if profit is a valid number
      const profitValue = Number.parseFloat(String(formData.profit));
      if (isNaN(profitValue)) {
        setValidationError("損益は有効な数値を入力してください")
        return
      }
      
      // Basic validation for numbers
      const parseNullableNumber = (v: any) => {
        if (v === undefined || v === null) return null;
        const s = String(v).trim();
        if (s === "") return null;
        const n = Number.parseFloat(s);
        return isNaN(n) ? null : n;
      }
      const parsedEntry = parseNullableNumber(formData.entry)
      const parsedExit = parseNullableNumber(formData.exit)
      const parsedLot = parseNullableNumber(formData.lot)
      const parsedPips = parseNullableNumber(formData.pips)
      const parsedProfit = formData.profit !== undefined && formData.profit !== null ? Number.parseFloat(String(formData.profit)) : 0
  
      // Calculate holding time in seconds from actual entry and exit times
      let holdingTimeInSeconds = 0;
      
      const entryCombined = formData.entryDate && formData.entryTime
        ? `${formData.entryDate}T${ensureTimeWithSeconds(formData.entryTime)}`
        : "";
      const exitCombined = formData.exitDate && formData.exitTime
        ? `${formData.exitDate}T${ensureTimeWithSeconds(formData.exitTime)}`
        : "";
      
      if (entryCombined && exitCombined) {
        const entryDate = new Date(entryCombined);
        const exitDate = new Date(exitCombined);
        
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
                              (formData.holdingMinutes || 0) * 60 +
                              (formData.holdingSeconds || 0)
      }
  
      const tradeDataToSave: any = {
        ...formData,
        entryTime: entryCombined,
        exitTime: exitCombined,
        entry: parsedEntry,
        exit: parsedExit,
        lot: parsedLot,
        pips: parsedPips,
        profit: parsedProfit,
        holdingTime: holdingTimeInSeconds,
      };
      
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
                  <Label>エントリー日時</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="entryDate"
                      type="date"
                      value={formData.entryDate || ""}
                      onChange={(e) => {
                        const date = e.target.value;
                        handleFormChange({ entryDate: date });
                      }}
                    />
                    <Input
                      id="entryTime"
                      type="time"
                      step="1"
                      placeholder="--:--:--"
                      value={formData.entryTime || ""}
                      onChange={(e) => {
                        const time = ensureTimeWithSeconds(e.target.value);
                        handleFormChange({ entryTime: time });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>エグジット日時</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="exitDate"
                      type="date"
                      value={formData.exitDate || ""}
                      onChange={(e) => {
                        const date = e.target.value;
                        handleFormChange({ exitDate: date });
                      }}
                    />
                    <Input
                      id="exitTime"
                      type="time"
                      step="1"
                      placeholder="--:--:--"
                      value={formData.exitTime || ""}
                      onChange={(e) => {
                        const time = ensureTimeWithSeconds(e.target.value);
                        handleFormChange({ exitTime: time });
                      }}
                    />
                  </div>
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
                    onChange={(e) => handleFormChange({ entry: e.target.value === "" ? undefined : Number.parseFloat(e.target.value) })}
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
                    onChange={(e) => handleFormChange({ exit: e.target.value === "" ? undefined : Number.parseFloat(e.target.value) })}
                    className="no-spinner"
                />
              </div>
            </div>
  
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lot">ロットサイズ</Label>
                <Input
                  id="lot"
                  type="number"
                  step="0.01"
                  value={formData.lot ?? ""}
                  onChange={(e) => handleFormChange({ lot: e.target.value === "" ? undefined : Number.parseFloat(e.target.value) })}
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
                  onChange={(e) => handleFormChange({ pips: e.target.value === "" ? undefined : Number.parseFloat(e.target.value) })}
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
                      variant={formData.emotion?.includes(emotion) ? "default" : "outline"}
                      className={`cursor-pointer text-xs ${
                        formData.emotion?.includes(emotion) ? "bg-black text-white hover:bg-black/90" : ""
                      }`}
                      onClick={() => {
                        const currentEmotions = formData.emotion || [];
                        if (currentEmotions.includes(emotion)) {
                          // If already selected, unselect it
                          handleFormChange({ emotion: currentEmotions.filter(e => e !== emotion) })
                        } else {
                          // If not selected, select it
                          handleFormChange({ emotion: [...currentEmotions, emotion] })
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
              <div className="grid grid-cols-4 gap-4">
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
                <div>
                  <Label htmlFor="holdingMinutes" className="text-sm text-muted-foreground">秒</Label>
                  <Input
                    id="holdingSeconds"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.holdingSeconds || ""}
                    onChange={(e) => handleFormChange({ 
                      holdingSeconds: e.target.value ? parseInt(e.target.value) : undefined 
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
                  ) : availableTagsList.length > 0 ? (
                    availableTagsList.map((tag, index) => (
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
                  {availableTagsList.length > 0 ? (
                    availableTagsList.map((tag, index) => (
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
                        variant={formData.emotion?.includes(emotion) ? "default" : "outline"}
                        className={`cursor-pointer text-xs ${
                          formData.emotion?.includes(emotion) ? "bg-black text-white hover:bg-black/90" : "hover:bg-red-50 hover:border-red-300"
                        }`}
                        onClick={() => {
                          const currentEmotions = formData.emotion || [];
                          if (currentEmotions.includes(emotion)) {
                            // If already selected, unselect it
                            handleFormChange({ emotion: currentEmotions.filter(e => e !== emotion) })
                          } else {
                            // If not selected, select it
                            handleFormChange({ emotion: [...currentEmotions, emotion] })
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