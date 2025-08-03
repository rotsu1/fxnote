"use client"

import { useState, useEffect } from "react"

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
import { 
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  AppSidebar
} from "@/components/ui/sidebar"
import { MonthlyNavigation } from "@/components/ui/monthly-navigation"
import { TradeEditDialog } from "@/components/ui/trade-edit-dialog"
import { CalendarGrid } from "@/components/ui/calendar-grid"
import { RightSidebar } from "@/components/ui/right-sidebar"
import { CSVImportDialog } from "@/components/ui/csv-import-dialog"
import { DisplaySettingsDialog } from "@/components/ui/display-settings-dialog"

import { saveTrade } from "@/utils/tradeUtils"
import { utcToLocalDateTime, groupTradesByDate } from "@/utils/timeUtils"
import { Trade } from "@/utils/types"

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

export default function CalendarPage() {
  const user = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>("");
  // Dialog visibility states
  const [dialogs, setDialogs] = useState({
    isRightSidebarOpen: false,
    isTradeDialogOpen: false,
    isCSVDialogOpen: false,
    isDisplaySettingsOpen: false,
  });
  // Trade-related data
  const [tradeData, setTradeData] = useState({
    editingTrade: null as any,
    deleteTradeId: null as number | null,
    trades: [] as any[],
    availableTags: [] as { id: number, tag_name: string }[],
  });
  // Loading and error states
  const [status, setStatus] = useState({
    loading: false,
    error: "",
  });
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
        setTradeData(prev => ({ ...prev, availableTags: [] }));
        return;
      }
      setTradeData(prev => ({ ...prev, availableTags: data || [] }));
    };
    loadTags();
  }, [user]);

  // Function to load trades
  const loadTrades = async () => {
    if (!user) return;
    setStatus(prev => ({ ...prev, loading: true, error: "" }));
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
        setStatus(prev => ({ ...prev, error: error.message }));
        setTradeData(prev => ({ ...prev, trades: [] }));
      } else {
        // Transform data to include symbol_name, tags, and emotions
        const transformedData = data?.map(trade => ({
          ...trade,
          symbol_name: trade.symbols?.symbol,
          tradeTags: trade.trade_tag_links?.map((link: any) => link.trade_tags?.tag_name).filter(Boolean) || [],
          tradeEmotions: trade.trade_emotion_links?.map((link: any) => link.emotions?.emotion).filter(Boolean) || []
        })) || [];
        setTradeData(prev => ({ ...prev, trades: transformedData }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, error: "Failed to load trades" }));
      setTradeData(prev => ({ ...prev, trades: [] }));
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Load display settings when user changes
  useEffect(() => {
    loadDisplaySettings();
  }, [user]);

  const groupedTrades = groupTradesByDate(tradeData.trades);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setDialogs(prev => ({ ...prev, isRightSidebarOpen: true }));
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
      setTradeData(prev => ({ ...prev, editingTrade: transformedTrade }));
      setDialogs(prev => ({ ...prev, isTradeDialogOpen: true }));
    } catch (error) {
      console.error("Error preparing trade for editing:", error);
      setStatus(prev => ({ ...prev, error: "取引の編集準備中にエラーが発生しました" }));
    } finally {

    }
  };

  const handleAddTrade = () => {
    setTradeData(prev => ({ ...prev, editingTrade: null }));
    // If no date is selected, use today's date
    if (!selectedDate) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
    }
    setDialogs(prev => ({ ...prev, isTradeDialogOpen: true }));
  };

  const handleSaveTrade = async (tradeDataParam: Partial<Trade>) => {
    const result = await saveTrade(tradeDataParam, tradeData.editingTrade, user);
    
    if (result?.success) {
      setDialogs(prev => ({ ...prev, isTradeDialogOpen: false }));
      setTradeData(prev => ({ ...prev, editingTrade: null }));
      // Refresh trades data to show the new/updated trade
      await loadTrades();
    } else {
      setStatus(prev => ({ ...prev, error: result?.error || "取引の保存中にエラーが発生しました" }));
    }
  };

  const handleDeleteTrade = (id: number) => {
    setTradeData(prev => ({ ...prev, deleteTradeId: id }));
  };

  const confirmDelete = async () => {
    if (!tradeData.deleteTradeId || !user) {
      setTradeData(prev => ({ ...prev, deleteTradeId: null }));
      return;
    }

    try {
      // Delete trade emotion links
      const { error: emotionError } = await supabase
        .from("trade_emotion_links")
        .delete()
        .eq("trade_id", tradeData.deleteTradeId);

      if (emotionError) {
        console.error("Error deleting trade emotion links:", emotionError);
      }

      // Delete trade tag links
      const { error: tagError } = await supabase
        .from("trade_tag_links")
        .delete()
        .eq("trade_id", tradeData.deleteTradeId);

      if (tagError) {
        console.error("Error deleting trade tag links:", tagError);
      }

      // Delete the main trade record
      const { error: tradeError } = await supabase
        .from("trades")
        .delete()
        .eq("id", tradeData.deleteTradeId)
        .eq("user_id", user.id);

      if (tradeError) {
        console.error("Error deleting trade:", tradeError);
        setStatus(prev => ({ ...prev, error: "取引の削除中にエラーが発生しました" }));
        return;
      }

      // Refresh the trades data
      await loadTrades();
      
      console.log("Trade deleted successfully");
    } catch (error) {
      console.error("Error deleting trade:", error);
      setStatus(prev => ({ ...prev, error: "取引の削除中にエラーが発生しました" }));
    } finally {
      setTradeData(prev => ({ ...prev, deleteTradeId: null }));
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
          {status.loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : status.error ? (
            <div className="text-center text-red-600 py-10">{status.error}</div>
          ) : (
            <>
              <MonthlyNavigation currentDate={currentDate} onDateChange={setCurrentDate} trades={tradeData.trades} onImportCSV={() => setDialogs(prev => ({ ...prev, isCSVDialogOpen: true }))} />
              <CalendarGrid currentDate={currentDate} onDateClick={handleDateClick} groupedTrades={groupedTrades} />
            </>
          )}
        </main>
        <RightSidebar
          isOpen={dialogs.isRightSidebarOpen}
          onClose={() => setDialogs(prev => ({ ...prev, isRightSidebarOpen: false }))}
          selectedDate={selectedDate}
          trades={selectedTrades}
          onEditTrade={handleEditTrade}
          onDeleteTrade={handleDeleteTrade}
          onAddTrade={handleAddTrade}
          onDisplaySettings={() => setDialogs(prev => ({ ...prev, isDisplaySettingsOpen: true }))}
          displaySettings={displaySettings}
        />
        <TradeEditDialog
          trade={tradeData.editingTrade}
          isOpen={dialogs.isTradeDialogOpen}
          onClose={() => setDialogs(prev => ({ ...prev, isTradeDialogOpen: false }))}
          onSave={handleSaveTrade}
          defaultDate={selectedDate || undefined}
          user={user}
          availableTags={tradeData.availableTags}
        />
        <CSVImportDialog 
          isOpen={dialogs.isCSVDialogOpen} 
          onClose={() => {
            setDialogs(prev => ({ ...prev, isCSVDialogOpen: false }));
            // Refresh trades data after CSV import
            loadTrades();
          }} 
          user={user} 
        />
        <DisplaySettingsDialog 
          isOpen={dialogs.isDisplaySettingsOpen} 
          onClose={() => setDialogs(prev => ({ ...prev, isDisplaySettingsOpen: false }))}
          displaySettings={displaySettings}
          onSaveSettings={handleSaveDisplaySettings}
        />
        <AlertDialog open={tradeData.deleteTradeId !== null} onOpenChange={() => setTradeData(prev => ({ ...prev, deleteTradeId: null }))}>
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
