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
} from "@/components/business/common/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { 
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  AppSidebar
} from "@/components/ui/sidebar"
import { MonthlyNavigation } from "@/components/business/calendar/monthly-navigation"
import { CalendarGrid } from "@/components/business/calendar/calendar-grid"
import { TradeEditDialog } from "@/components/business/common/trade-edit-dialog"
import { RightSidebar } from "@/components/business/calendar/right-sidebar"
import { CSVImportDialog } from "@/components/business/common/csv-import-dialog"
import { DisplaySettingsDialog } from "@/components/business/common/display-settings-dialog"

import { saveTrade } from "@/utils/trading/tradeUtils"
import { groupTradesByDate } from "@/utils/ui/timeUtils"
import { Trade } from "@/utils/core/types"
import { 
  loadDisplaySettings,
  saveDisplaySettings,
  convertToDisplaySettings,
  type DisplaySettings
} from "@/utils/ui/displaySettingsUtils"
import {
  transformTradeForEditing,
  deleteTrade,
  loadUserTags
} from "@/utils/trading/tradeCrudUtils"
import { loadTrades as loadTradesData } from "@/utils/data/dataLoadingUtils"

import { useAuth } from "@/hooks/useAuth";

export default function Calendar() {
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
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
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
  const loadDisplaySettingsFromDB = async () => {
    if (!user) return;
    
    try {
      const settings = await loadDisplaySettings(user.id);
      setDisplaySettings(settings);
    } catch (error) {
      console.error("Error loading display settings:", error);
    }
  };

  useEffect(() => {
    loadTrades();
    if (!user) return;
    const loadTags = async () => {
      const tags = await loadUserTags(user.id);
      setTradeData(prev => ({ ...prev, availableTags: tags }));
    };
    loadTags();
  }, [user]);

  // Function to load trades
  const loadTrades = async () => {
    if (!user) return;
    setStatus(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const { data, error } = await loadTradesData(user.id);
      
      if (error) {
        setStatus(prev => ({ ...prev, error }));
        setTradeData(prev => ({ ...prev, trades: [] }));
      } else {
        setTradeData(prev => ({ ...prev, trades: data }));
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
    loadDisplaySettingsFromDB();
  }, [user]);

  const groupedTrades = groupTradesByDate(tradeData.trades);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setDialogs(prev => ({ ...prev, isRightSidebarOpen: true }));
  };

  const handleEditTrade = async (trade: any) => {
    try {
      const transformedTrade = transformTradeForEditing(trade);
      
      setTradeData(prev => ({ ...prev, editingTrade: transformedTrade }));
      setDialogs(prev => ({ ...prev, isTradeDialogOpen: true }));
    } catch (error) {
      console.error("Error preparing trade for editing:", error);
      setStatus(prev => ({ ...prev, error: "取引の編集準備中にエラーが発生しました" }));
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
      const result = await deleteTrade(tradeData.deleteTradeId, user.id);
      
      if (result.success) {
        // Refresh the trades data
        await loadTrades();
      } else {
        setStatus(prev => ({ ...prev, error: result.error || "取引の削除中にエラーが発生しました" }));
      }
    } catch (error) {
      console.error("Error deleting trade:", error);
      setStatus(prev => ({ ...prev, error: "取引の削除中にエラーが発生しました" }));
    } finally {
      setTradeData(prev => ({ ...prev, deleteTradeId: null }));
    }
  };

  const handleSaveDisplaySettings = async (settings: DisplaySettings) => {
    if (!user) return;
    
    try {
      const success = await saveDisplaySettings(user.id, settings);
      
      if (success) {
        // Update local state
        setDisplaySettings(settings);
      }
    } catch (error) {
      console.error("Error saving display settings:", error);
    }
  };

  // Wrapper function to handle type conversion for DisplaySettingsDialog
  const handleSaveDisplaySettingsWrapper = (settings: Record<string, boolean>) => {
    const displaySettings = convertToDisplaySettings(settings);
    handleSaveDisplaySettings(displaySettings);
  };

  const selectedTrades = groupedTrades[selectedDate] || [];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">カレンダー</h1>
          </div>
        </header>
        <main className="flex-1 px-4 md:px-6 pt-6">
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
          onSaveSettings={handleSaveDisplaySettingsWrapper}
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
