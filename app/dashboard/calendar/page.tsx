"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
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
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
import { MonthlyNavigation } from "@/components/ui/monthly-navigation"

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { TradeEditDialog } from "@/components/ui/trade-edit-dialog"

import { saveTrade } from "@/utils/tradeUtils"
import { localDateTimeToUTC, utcToLocalDateTime, formatHoldTime, groupTradesByDate } from "@/utils/timeUtils"
import { CalendarGrid } from "@/components/ui/calendar-grid"
import { RightSidebar } from "@/components/ui/right-sidebar"
import { CSVImportDialog } from "@/components/ui/csv-import-dialog"

interface Trade {
  id: number
  date: string
  time: string
  entryTime?: string
  exitTime?: string
  pair: string
  type: "買い" | "売り"
  entry: number
  exit: number
  lot?: number
  pips: number
  profit: number
  emotion: string[]
  holdingTime: number
  holdingDays?: number
  holdingHours?: number
  holdingMinutes?: number
  notes?: string
  tags: string[]
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
  const [availableTags, setAvailableTags] = useState<{ id: number, tag_name: string }[]>([]);
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
    if (!user) return;
    const loadTags = async () => {
      const { data, error } = await supabase
        .from("trade_tags")
        .select("id, tag_name")
        .eq("user_id", user.id)
        .order("tag_name");
      if (error) {
        console.error("Error loading tags for table:", error);
        setAvailableTags([]);
        return;
      }
      setAvailableTags(data || []);
    };
    loadTags();
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
          symbols!inner(symbol),
          trade_tag_links(
            trade_tags(tag_name)
          ),
          trade_emotion_links(
            emotions(emotion)
          )
        `)
        .eq("user_id", user.id);
      
      if (error) {
        setError(error.message);
        setTrades([]);
      } else {
        // Transform data to include symbol_name, tags, and emotions
        const transformedData = data?.map(trade => ({
          ...trade,
          symbol_name: trade.symbols?.symbol,
          tradeTags: trade.trade_tag_links?.map((link: any) => link.trade_tags?.tag_name).filter(Boolean) || [],
          tradeEmotions: trade.trade_emotion_links?.map((link: any) => link.emotions?.emotion).filter(Boolean) || []
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
      // Use pre-loaded trade data
      const tradeTags = trade.tradeTags || [];
      const tradeEmotions = trade.tradeEmotions || [];

      // Transform database trade data to form format
      const transformedTrade = {
        id: trade.id,
        date: trade.entry_time?.split("T")[0] || "",
        time: trade.entry_time?.split("T")[1]?.slice(0, 5) || "",
        entryTime: utcToLocalDateTime(trade.entry_time),
        exitTime: utcToLocalDateTime(trade.exit_time),
        pair: trade.symbol_name || "", // Use symbol name for display
        type: trade.trade_type === 0 ? "買い" : "売り",
        entry: trade.entry_price,
        exit: trade.exit_price,
        lot: trade.lot_size,
        pips: trade.pips,
        profit: trade.profit_loss,
        emotion: tradeEmotions,
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
    const result = await saveTrade(tradeData, editingTrade, user);
    
    if (result?.success) {
      setIsTradeDialogOpen(false);
      setEditingTrade(null);
      // Refresh trades data to show the new/updated trade
      await loadTrades();
    } else {
      setError(result?.error || "取引の保存中にエラーが発生しました");
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
          defaultDate={selectedDate || undefined}
          user={user}
          availableTags={availableTags}
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
