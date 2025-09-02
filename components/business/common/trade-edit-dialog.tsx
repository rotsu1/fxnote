"use client"

import {
    Edit,
    Tag,
  } from "lucide-react"

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/business/common/alert-dialog"
import { Trade } from "@/utils/core/types"
import { TagEditDialog } from "./tag-edit-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"


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
    
    // Ref for dialog content to enable scrolling
    const dialogContentRef = useRef<HTMLDivElement>(null);
    
    // Function to scroll dialog to top
    const scrollToTop = () => {
      // Small delay to ensure error message is rendered before scrolling
      setTimeout(() => {
        if (dialogContentRef.current) {
          dialogContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
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
            entryDate: trade.entryTime ? (trade.entryTime.split("T")[0] || "") : (trade.entryDate || trade.date || defaultDateStr),
            entryTime: trade.entryTime ? (trade.entryTime.split("T")[1] || "") : "",
            exitDate: trade.exitTime ? (trade.exitTime.split("T")[0] || "") : (trade.exitDate || trade.date || defaultDateStr),
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
            holdingTime: undefined,
            holdingDays: undefined,
            holdingHours: undefined,
            holdingMinutes: undefined,
            holdingSeconds: undefined,
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
    const [datetimeValidationError, setDatetimeValidationError] = useState("")
    const [dateValidationError, setDateValidationError] = useState("")
    const [lotValidationError, setLotValidationError] = useState("")
    const [holdingTimeValidationError, setHoldingTimeValidationError] = useState("")
    const [availableSymbols, setAvailableSymbols] = useState<string[]>([])
    const [loadingSymbols, setLoadingSymbols] = useState(false)
  
    useEffect(() => {
      const defaultDateStrLocal = defaultDate || new Date().toISOString().split("T")[0];
      
      // Helper function to convert holding time in seconds to individual fields
      const convertHoldingTimeToFields = (holdingTimeInSeconds: number | null | undefined) => {
        if (holdingTimeInSeconds === null || holdingTimeInSeconds === undefined || holdingTimeInSeconds === 0) {
          return {
            holdingDays: undefined,
            holdingHours: undefined,
            holdingMinutes: undefined,
            holdingSeconds: undefined,
          };
        }
        
        const totalSeconds = Math.abs(holdingTimeInSeconds);
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;
        
        return {
          holdingDays: days > 0 ? days : undefined,
          holdingHours: hours > 0 ? hours : undefined,
          holdingMinutes: minutes > 0 ? minutes : undefined,
          holdingSeconds: seconds > 0 ? seconds : undefined,
        };
      };
      
      const newFormData: TradeForm = trade
        ? {
            ...trade,
            entryDate: trade.entryTime ? (trade.entryTime.split("T")[0] || "") : (trade.entryDate || trade.date || defaultDateStrLocal),
            entryTime: trade.entryTime ? (trade.entryTime.split("T")[1] || "") : "",
            exitDate: trade.exitTime ? (trade.exitTime.split("T")[0] || "") : (trade.exitDate || trade.date || defaultDateStrLocal),
            exitTime: trade.exitTime ? (trade.exitTime.split("T")[1] || "") : "",
            ...convertHoldingTimeToFields(trade.holdingTime),
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
            holdingTime: undefined,
            holdingDays: undefined,
            holdingHours: undefined,
            holdingMinutes: undefined,
            holdingSeconds: undefined,
            notes: "",
            tags: [],
          };

      setFormData(newFormData);
      setHasUnsavedChanges(false);
      setDatetimeValidationError("");
      setValidationError("");
      setLotValidationError("");
      setHoldingTimeValidationError("");
    }, [trade, defaultDate, isOpen])
    
    // Clear validation errors when dialog closes
    useEffect(() => {
      if (!isOpen) {
        setDatetimeValidationError("");
        setValidationError("");
        setLotValidationError("");
        setHoldingTimeValidationError("");
      }
    }, [isOpen])
  
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
          .eq("user_id", user.id)
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
      
      // Clear date validation errors when date fields change (times are optional)
      if ('entryDate' in updates || 'exitDate' in updates) {
        setDateValidationError("");
      }
      
      // Clear lot validation errors when lot field changes
      if ('lot' in updates) {
        setLotValidationError("");
        
        // Real-time lot validation
        const newLot = updates.lot;
        if (newLot !== undefined && newLot !== null) {
          if (newLot <= 0) {
            setLotValidationError("ロットサイズは0より大きい値を入力してください");
          } else {
            setLotValidationError("");
          }
        }
      }
      
      // Real-time datetime validation - check both full datetime and date-only scenarios
      const newFormData = { ...formData, ...updates };
      let hasDatetimeError = false;
      
      if (newFormData.entryDate && newFormData.entryTime && newFormData.exitDate && newFormData.exitTime) {
        // Both times provided - validate full datetime
        const entryCombined = `${newFormData.entryDate}T${ensureTimeWithSeconds(newFormData.entryTime)}`;
        const exitCombined = `${newFormData.exitDate}T${ensureTimeWithSeconds(newFormData.exitTime)}`;
        const entryDate = new Date(entryCombined);
        const exitDate = new Date(exitCombined);
        
        if (!isNaN(entryDate.getTime()) && !isNaN(exitDate.getTime()) && exitDate < entryDate) {
          hasDatetimeError = true;
        }
      } else if (newFormData.entryDate && newFormData.exitDate) {
        // Only dates provided - validate date order (times will default to midnight)
        const entryDate = new Date(newFormData.entryDate);
        const exitDate = new Date(newFormData.exitDate);
        
        if (!isNaN(entryDate.getTime()) && !isNaN(exitDate.getTime()) && exitDate < entryDate) {
          hasDatetimeError = true;
        }
      }
      
      if (hasDatetimeError) {
        setDatetimeValidationError("エグジット日付はエントリー日付より後である必要があります");
        scrollToTop();
      } else {
        setDatetimeValidationError("");
      }
      
      // Real-time holding time validation
      if ('holdingDays' in updates || 'holdingHours' in updates || 'holdingMinutes' in updates || 'holdingSeconds' in updates) {
        const updatedFormData = { ...formData, ...updates };
        const hasNegativeHoldingTime = (
          (updatedFormData.holdingDays !== undefined && updatedFormData.holdingDays !== null && updatedFormData.holdingDays < 0) ||
          (updatedFormData.holdingHours !== undefined && updatedFormData.holdingHours !== null && updatedFormData.holdingHours < 0) ||
          (updatedFormData.holdingMinutes !== undefined && updatedFormData.holdingMinutes !== null && updatedFormData.holdingMinutes < 0) ||
          (updatedFormData.holdingSeconds !== undefined && updatedFormData.holdingSeconds !== null && updatedFormData.holdingSeconds < 0)
        );
        
        if (hasNegativeHoldingTime) {
          setHoldingTimeValidationError("保持時間は正の数値を入力してください");
        } else {
          setHoldingTimeValidationError("");
        }
      }
    };
  
    const handleSave = () => {
      // Clear previous validation errors
      setValidationError("")
      setDateValidationError("")
      
      // Validate that both entry and exit dates are filled (times are optional)
      if (!formData.entryDate || !formData.exitDate) {
        setDateValidationError("エントリー日付とエグジット日付は両方とも入力が必要です");
        scrollToTop();
        return;
      }
      
      // Validate datetime order - check both full datetime and date-only scenarios
      let hasDatetimeError = false;
      
      if (formData.entryDate && formData.entryTime && formData.exitDate && formData.exitTime) {
        // Both times provided - validate full datetime
        const entryCombined = `${formData.entryDate}T${ensureTimeWithSeconds(formData.entryTime)}`;
        const exitCombined = `${formData.exitDate}T${ensureTimeWithSeconds(formData.exitTime)}`;
        const entryDate = new Date(entryCombined);
        const exitDate = new Date(exitCombined);
        
        if (!isNaN(entryDate.getTime()) && !isNaN(exitDate.getTime()) && exitDate < entryDate) {
          hasDatetimeError = true;
        }
      } else if (formData.entryDate && formData.exitDate) {
        // Only dates provided - validate date order (times will default to midnight)
        const entryDate = new Date(formData.entryDate);
        const exitDate = new Date(formData.exitDate);
        
        if (!isNaN(entryDate.getTime()) && !isNaN(exitDate.getTime()) && exitDate < entryDate) {
          hasDatetimeError = true;
        }
      }
      
      if (hasDatetimeError) {
        setDatetimeValidationError("エグジット日付はエントリー日付より後である必要があります");
        scrollToTop();
        return;
      }
      
      // Clear datetime validation error if validation passes
      setDatetimeValidationError("");
      
      // Validation: Check if required fields are filled
      if (!formData.pair || !formData.pair.trim()) {
        setValidationError("シンボルを選択してください")
        scrollToTop();
        return
      }
      
      if (formData.profit === undefined || formData.profit === null) {
        setValidationError("損益を入力してください")
        scrollToTop();
        return
      }
      
      // Additional validation: Check if profit is a valid number
      const profitValue = Number.parseFloat(String(formData.profit));
      if (isNaN(profitValue)) {
        setValidationError("損益は有効な数値を入力してください")
        scrollToTop();
        return
      }
      
      // Validation: Check if lot is valid (null is allowed, but if present must be > 0)
      if (formData.lot !== undefined && formData.lot !== null && formData.lot <= 0) {
        setLotValidationError("ロットサイズは0より大きい値を入力してください")
        scrollToTop();
        return
      }
      
      // Validation: Check if any holding time fields are negative
      const hasNegativeHoldingTime = (
        (formData.holdingDays !== undefined && formData.holdingDays !== null && formData.holdingDays < 0) ||
        (formData.holdingHours !== undefined && formData.holdingHours !== null && formData.holdingHours < 0) ||
        (formData.holdingMinutes !== undefined && formData.holdingMinutes !== null && formData.holdingMinutes < 0) ||
        (formData.holdingSeconds !== undefined && formData.holdingSeconds !== null && formData.holdingSeconds < 0)
      );
      
      if (hasNegativeHoldingTime) {
        setHoldingTimeValidationError("保持時間は正の数値を入力してください");
        return;
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
      
      // Build combined datetime strings only when both date and time are provided
      // If time is not provided, keep it as null to avoid defaulting to midnight
      const entryCombined = formData.entryDate && formData.entryTime && formData.entryTime.trim()
        ? `${formData.entryDate}T${ensureTimeWithSeconds(formData.entryTime)}`
        : null;
      const exitCombined = formData.exitDate && formData.exitTime && formData.exitTime.trim()
        ? `${formData.exitDate}T${ensureTimeWithSeconds(formData.exitTime)}`
        : null;

      // Calculate holding time in seconds. If any manual holding input is provided, use it. Otherwise, use entry/exit datetime difference if available.
      let holdingTimeInSeconds: number | null = null;
      
      // Check if any manual holding input has been provided (including 0 values)
      const hasManualHoldingInput = (
        (formData.holdingDays !== undefined && formData.holdingDays !== null) ||
        (formData.holdingHours !== undefined && formData.holdingHours !== null) ||
        (formData.holdingMinutes !== undefined && formData.holdingMinutes !== null) ||
        (formData.holdingSeconds !== undefined && formData.holdingSeconds !== null)
      );

      if (hasManualHoldingInput) {
        const d = Number(formData.holdingDays) || 0;
        const h = Number(formData.holdingHours) || 0;
        const m = Number(formData.holdingMinutes) || 0;
        const s = Number(formData.holdingSeconds) || 0;
        holdingTimeInSeconds = d * 24 * 60 * 60 + h * 60 * 60 + m * 60 + s;
      } else if (entryCombined && exitCombined) {
        // Calculate from entry/exit if both full datetimes are provided
        const entryDate = new Date(entryCombined);
        const exitDate = new Date(exitCombined);
        if (!isNaN(entryDate.getTime()) && !isNaN(exitDate.getTime())) {
          const timeDiff = exitDate.getTime() - entryDate.getTime();
          holdingTimeInSeconds = Math.max(0, Math.floor(timeDiff / 1000));
        }
      } else if (formData.entryDate && formData.exitDate && !formData.entryTime && !formData.exitTime) {
        // If only dates are provided (no times), calculate holding time based on date difference
        // This will give us the number of days between entry and exit dates
        const entryDate = new Date(formData.entryDate);
        const exitDate = new Date(formData.exitDate);
        if (!isNaN(entryDate.getTime()) && !isNaN(exitDate.getTime())) {
          const timeDiff = exitDate.getTime() - entryDate.getTime();
          holdingTimeInSeconds = Math.max(0, Math.floor(timeDiff / 1000));
        }
      }
      // If neither manual input nor entry/exit datetime is available, holdingTimeInSeconds remains null
  
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
        tags: formData.tags || [],
        emotion: formData.emotion || [],
      };
      
      onSave(tradeDataToSave)
      setHasUnsavedChanges(false);
      setDateValidationError("");
    }
  
    const handleClose = () => {
      if (hasUnsavedChanges) {
        setShowDiscardWarning(true);
      } else {
        setDatetimeValidationError("");
        setDateValidationError("");
        setValidationError("");
        setLotValidationError("");
        setHoldingTimeValidationError("");
        onClose();
      }
    };
  
    const handleDiscard = () => {
      setShowDiscardWarning(false);
      setHasUnsavedChanges(false);
      setDatetimeValidationError("");
      setDateValidationError("");
      setValidationError("");
      setLotValidationError("");
      setHoldingTimeValidationError("");
      onClose();
    };
  
    return (
      <>
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent ref={dialogContentRef} className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  {dateValidationError && (
                    <div className="text-red-600 text-sm mt-1">{dateValidationError}</div>
                  )}
                  {datetimeValidationError && (
                    <div className="text-red-600 text-sm mt-1">{datetimeValidationError}</div>
                  )}
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
                <Input
                  id="pair"
                  placeholder="シンボルを入力 (例: USDJPY)"
                  value={formData.pair || ""}
                  onChange={(e) => handleFormChange({ pair: e.target.value })}
                />
                {validationError && validationError.includes("シンボル") && (
                  <div className="text-red-600 text-sm mt-1">{validationError}</div>
                )}
                <div className="mt-2 border rounded p-2 max-h-28 overflow-y-auto">
                  {loadingSymbols ? (
                    <div className="text-xs text-muted-foreground">読み込み中...</div>
                  ) : (
                    (() => {
                      const q = (formData.pair || '').toLowerCase();
                      const list = Array.from(new Set(availableSymbols))
                        .filter(s => !q || s.toLowerCase().includes(q))
                        .slice(0, 30);
                      if (list.length === 0) {
                        return <div className="text-xs text-muted-foreground">過去のシンボルはありません</div>;
                      }
                      return (
                        <div className="flex flex-wrap gap-1">
                          {list.map((s) => (
                            <Badge
                              key={s}
                              variant={formData.pair === s ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => handleFormChange({ pair: s })}
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
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
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") { handleFormChange({ entry: undefined }); return }
                      const n = Number.parseFloat(v)
                      if (Number.isNaN(n)) return
                      handleFormChange({ entry: n })
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
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
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") { handleFormChange({ exit: undefined }); return }
                      const n = Number.parseFloat(v)
                      if (Number.isNaN(n)) return
                      handleFormChange({ exit: n })
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
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
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "") { 
                      handleFormChange({ lot: undefined }); 
                      return 
                    }
                    
                    const n = Number.parseFloat(v)
                    if (Number.isNaN(n)) return
                    handleFormChange({ lot: n })
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0.01"
                  className="no-spinner"
                />
                {lotValidationError && (
                  <div className="text-red-600 text-sm mt-1">{lotValidationError}</div>
                )}
              </div>
              <div>
                <Label htmlFor="pips">pips</Label>
                <Input
                  id="pips"
                  type="number"
                  step="0.1"
                  value={formData.pips ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "") { handleFormChange({ pips: undefined }); return }
                    const n = Number.parseFloat(v)
                    if (Number.isNaN(n)) return
                    handleFormChange({ pips: n })
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
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
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") { handleFormChange({ profit: undefined }); return }
                      const n = Number.parseFloat(v)
                      if (Number.isNaN(n)) return
                      handleFormChange({ profit: n })
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="no-spinner"
                />
                {validationError && (validationError.includes("損益") || validationError.includes("有効な数値")) && (
                  <div className="text-red-600 text-sm mt-1">{validationError}</div>
                )}
              </div>
            </div>
            
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
                    value={formData.holdingDays ?? ""}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") { handleFormChange({ holdingDays: undefined }); return }
                      const n = Number.parseInt(v, 10)
                      if (Number.isNaN(n)) return
                      handleFormChange({ holdingDays: n })
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
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
                    value={formData.holdingHours ?? ""}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") { handleFormChange({ holdingHours: undefined }); return }
                      const n = Number.parseInt(v, 10)
                      if (Number.isNaN(n)) return
                      handleFormChange({ holdingHours: n })
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
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
                    value={formData.holdingMinutes ?? ""}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") { handleFormChange({ holdingMinutes: undefined }); return }
                      const n = Number.parseInt(v, 10)
                      if (Number.isNaN(n)) return
                      handleFormChange({ holdingMinutes: n })
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
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
                    value={formData.holdingSeconds ?? ""}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") { handleFormChange({ holdingSeconds: undefined }); return }
                      const n = Number.parseInt(v, 10)
                      if (Number.isNaN(n)) return
                      handleFormChange({ holdingSeconds: n })
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0"
                  />
                </div>
              </div>
              {holdingTimeValidationError && (
                <div className="text-red-600 text-sm mt-1">{holdingTimeValidationError}</div>
              )}
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
        <TagEditDialog
          isOpen={isTagEditOpen}
          onOpenChange={setIsTagEditOpen}
          title="タグ管理"
          description="データベースのタグを追加または削除してください。"
          addLabel="新しいタグを追加"
          placeholder="新しいタグ名を入力"
          availableItems={availableTagsList}
          newItem={newTag}
          onNewItemChange={handleNewTagChange}
          onAddItem={addNewTagToDatabase}
          onDeleteItem={confirmDeleteTag}
          error={tagError}
          icon="tag"
          emptyMessage="タグがありません"
          helpText="タグをクリックして削除"
        />

        {/* Emotion Edit Dialog */}
        <TagEditDialog
          isOpen={isEmotionEditOpen}
          onOpenChange={setIsEmotionEditOpen}
          title="感情管理"
          description="データベースの感情を追加または削除してください。"
          addLabel="新しい感情を追加"
          placeholder="新しい感情名を入力"
          availableItems={availableEmotions}
          newItem={newEmotion}
          onNewItemChange={handleNewEmotionChange}
          onAddItem={addNewEmotionToDatabase}
          onDeleteItem={confirmDeleteEmotion}
          error={emotionError}
          icon="plus"
          emptyMessage="感情がありません"
          helpText="感情をクリックして削除"
        />

        {/* Tag Delete Warning Dialog */}
        <ConfirmDialog
          open={tagToDelete !== null}
          onOpenChange={() => setTagToDelete(null)}
          title="タグを削除しますか？"
          description={
            <>
              <span className="mb-2 block">
                <strong>「{tagToDelete}」</strong> タグを削除しようとしています。
              </span>
              <span className="text-red-600 block">
                ⚠️ このタグは、このタグを使用しているすべての取引から削除されます。
              </span>
              <span className="text-sm text-muted-foreground mt-2 block">
                この操作は取り消すことができません。
              </span>
            </>
          }
          onConfirm={deleteTagFromDatabase}
        />

        {/* Emotion Delete Warning Dialog */}
        <ConfirmDialog
          open={emotionToDelete !== null}
          onOpenChange={() => setEmotionToDelete(null)}
          title="感情を削除しますか？"
          description={
            <>
              <span className="mb-2 block">
                <strong>「{emotionToDelete}」</strong> 感情を削除しようとしています。
              </span>
              <span className="text-red-600 block">
                ⚠️ この感情は、この感情を使用しているすべての取引から削除されます。
              </span>
              <span className="text-sm text-muted-foreground mt-2 block">
                この操作は取り消すことができません。
              </span>
            </>
          }
          onConfirm={deleteEmotionFromDatabase}
        />

        {/* Discard Changes Warning Dialog */}
        <ConfirmDialog
          open={showDiscardWarning}
          onOpenChange={setShowDiscardWarning}
          title="変更を破棄しますか？"
          description={
            <>
              <span className="mb-2 block">
                保存されていない変更があります。
              </span>
              <span className="text-red-600 block">
                ⚠️ 現在入力されているデータは破棄されます。
              </span>
              <span className="text-sm text-muted-foreground mt-2 block">
                この操作は取り消すことができません。
              </span>
            </>
          }
          onConfirm={handleDiscard}
        />
      </>
    )
  }
