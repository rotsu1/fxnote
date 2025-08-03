"use client"

import { useState, useMemo, useCallback, useEffect } from "react"

import {
  CalendarIcon,
  Settings,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

import { CardDescription } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
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
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  AppSidebar
} from "@/components/ui/sidebar"
import {
  TableSettingsDialog,
  allColumns
} from "@/components/ui/table-settings-dialog"
import { TradeEditDialog } from "@/components/ui/trade-edit-dialog"

import { saveTrade } from "@/utils/tradeUtils"
import { localDateTimeToUTC, utcToLocalDateTime } from "@/utils/timeUtils"
import { Trade } from "@/utils/types"
import { isFieldEditable, validateCellValue, mapFieldToDatabase, getColumnValue, transformTradeData } from "@/utils/tableUtils"
import { loadSymbols, loadEmotions, loadTags } from "@/utils/dataLoadingUtils"
import { filterAndSortTrades } from "@/utils/tableFilterUtils"
import { handleCellClickLogic, handleHoldingTimeChange, handleCellEscape, handleCellBlurLogic } from "@/utils/cellEditingUtils"
import { saveCellValue } from "@/utils/cellSaveUtils"

import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

export default function TablePage() {
  const user = useAuth();
  // Grouped cell editing states
  const [cellEditingState, setCellEditingState] = useState({
    editingCell: null as { id: number; field: keyof Trade } | null,
    editingValues: {} as Record<string, any>,
    savingCells: new Set<string>(),
    cellErrors: {} as Record<string, string>,
    originalValues: {} as Record<string, any>
  });
  // Grouped dialog/modal states
  const [dialogState, setDialogState] = useState({
    isTradeDialogOpen: false,
    isTableSettingsOpen: false,
    showDiscardWarning: false
  });
  // Grouped table configuration states
  const [tableConfig, setTableConfig] = useState({
    visibleColumns: allColumns.filter((col) => col.defaultVisible).map((col) => col.id),
    originalVisibleColumns: [] as string[],
    sortConfig: { key: null as keyof Trade | null, direction: 'asc' as 'asc' | 'desc' },
    draggedColumn: null as string | null,
    hasUnsavedChanges: false
  });
  // Grouped loading/error states
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    isSaving: false
  });
  // Individual states for distinct concepts
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingTrade, setEditingTrade] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<Set<number>>(new Set());
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [availableEmotions, setAvailableEmotions] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<{ id: number, tag_name: string }[]>([]);
  const [isComposing, setIsComposing] = useState(false);

  // Load tags from trade_tags for the current user
  useEffect(() => {
    if (!user) return;
    const loadTagsForTable = async () => {
      const { data, error } = await loadTags(user.id);
      if (error) {
        console.error("Error loading tags for table:", error);
        setAvailableTags([]);
        return;
      }
      setAvailableTags(data);
    };
    loadTagsForTable();
  }, [user]);

  // Load symbols from database for table editing
  const loadSymbolsForTable = async () => {
    if (!user) return;
    
    const { data: symbols, error } = await loadSymbols();
    
    if (error) {
      console.error("Error loading symbols for table:", error);
      return;
    }
    
    setAvailableSymbols(symbols);
  }

  // Load emotions from database for table editing
  const loadEmotionsForTable = async () => {
    if (!user) return;
    
    const { data: emotions, error } = await loadEmotions(user.id);
    
    if (error) {
      console.error("Error loading emotions for table:", error);
      return;
    }
    
    setAvailableEmotions(emotions);
  }

  useEffect(() => {
    if (!user) return;
    
    // Load symbols for table editing
    loadSymbolsForTable();
    
    // Load emotions for table editing
    loadEmotionsForTable();
    
    const loadTrades = async () => {
      setStatus({ loading: true, error: "", isSaving: false });
      setStatus({ loading: false, error: "", isSaving: false });
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

          setTableConfig({ ...tableConfig, visibleColumns: orderedColumns, originalVisibleColumns: orderedColumns });
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
          setStatus({ loading: false, error: tradesError.message, isSaving: false });
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

        const emotionsByTradeId = (emotionLinksData || []).reduce((acc: Record<number, string[]>, link: any) => {
          // Only include emotions for trades that belong to the current user
          if (userTradeIds.has(link.trade_id)) {
            if (!acc[link.trade_id]) acc[link.trade_id] = [];
            acc[link.trade_id].push(link.emotions.emotion);
          }
          return acc;
        }, {});

        // Transform DB data to match Trade interface
        const transformedTrades = (tradesData || []).map((trade: any) => 
          transformTradeData(trade, tagsByTradeId, emotionsByTradeId)
        ) as Trade[];

        setTrades(transformedTrades);
      } catch (error: any) {
        console.error("Error loading trades:", error);
        setStatus({ loading: false, error: error.message || "取引データの読み込み中にエラーが発生しました", isSaving: false });
      } finally {
        setStatus({ loading: false, error: "", isSaving: false });
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
      if (cellEditingState.editingCell || Object.keys(cellEditingState.editingValues).length > 0) {
        e.preventDefault();
        e.returnValue = '編集中のデータがあります。ページを離れますか？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cellEditingState.editingCell, cellEditingState.editingValues]);

  const filteredTrades = useMemo(() => {
    return filterAndSortTrades(trades, {
      selectedDate,
      sortConfig: tableConfig.sortConfig
    });
  }, [trades, selectedDate, tableConfig.sortConfig]);

  const handleCellClick = (id: number, field: keyof Trade) => {
    const trade = trades.find(t => t.id === id);
    if (!trade) return;
    
    const result = handleCellClickLogic(id, field, trade, cellEditingState);
    
    if (result.shouldOpenDialog) {
      setEditingTrade(trade);
      setDialogState({ ...dialogState, isTradeDialogOpen: true });
      return;
    }
    
    setCellEditingState(prev => ({
      ...prev,
      ...result.newEditingState
    }));
  };

  const handleCellChange = useCallback((id: number, field: keyof Trade, value: any) => {
    const cellKey = `${id}-${field}`;
    
    const newState = handleHoldingTimeChange(id, field, value, cellEditingState);
    
    setCellEditingState(prev => ({
      ...prev,
      ...newState,
      cellErrors: {
        ...prev.cellErrors,
        [cellKey]: ""
      }
    }));
  }, [cellEditingState]);

  const handleCellSave = useCallback(async (id: number, field: keyof Trade) => {
    const cellKey = `${id}-${field}`;
    const value = cellEditingState.editingValues[cellKey];
    const originalValue = cellEditingState.originalValues[cellKey];
    
    console.log('handleCellSave called:', { id, field, value, cellKey });
    
    if (value === undefined) {
      console.log('Value is undefined, returning early');
      return;
    }
    
    setCellEditingState(prev => ({
      ...prev,
      savingCells: new Set(prev.savingCells).add(cellKey)
    }));
    
    const result = await saveCellValue({
      id,
      field,
      value,
      originalValue,
      user: user!
    });
    
    if (result.success) {
      if (result.displayValue !== undefined) {
        // Update local state with the display value
        setTrades(prevTrades => 
          prevTrades.map(trade => 
            trade.id === id ? { ...trade, [field]: result.displayValue } : trade
          )
        );
      }
      
      // Clear editing state
      setCellEditingState(prev => ({
        ...prev,
        editingCell: null,
        editingValues: {
          ...prev.editingValues,
          [cellKey]: undefined
        },
        originalValues: {
          ...prev.originalValues,
          [cellKey]: undefined
        }
      }));
    } else {
      // Set error state
      setCellEditingState(prev => ({
        ...prev,
        cellErrors: {
          ...prev.cellErrors,
          [cellKey]: result.error || '更新に失敗しました'
        }
      }));
    }
    
    // Clear saving state
    setCellEditingState(prev => {
      const newSet = new Set(prev.savingCells);
      newSet.delete(cellKey);
      return { ...prev, savingCells: newSet };
    });
  }, [cellEditingState.editingValues, cellEditingState.originalValues, user]);

  const handleCellBlur = useCallback(() => {
    const result = handleCellBlurLogic(cellEditingState, status.isSaving);
    
    // Apply the new editing state
    setCellEditingState(prev => ({
      ...prev,
      ...result.newEditingState
    }));
    
    // If changes were made, save them
    if (result.shouldSave) {
      console.log('Changes detected, calling handleCellSave');
      setStatus({ ...status, isSaving: true });
      handleCellSave(cellEditingState.editingCell!.id, cellEditingState.editingCell!.field);
    }
  }, [cellEditingState, status.isSaving, handleCellSave, status]);

  // Global click handler for emotions and tags containers
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleGlobalClick = (event: MouseEvent) => {
      if (
        cellEditingState.editingCell &&
        (cellEditingState.editingCell.field === 'emotion' || cellEditingState.editingCell.field === 'tags') &&
        !status.isSaving
      ) {
        const target = event.target as Element;
        const containerSelector = cellEditingState.editingCell.field === 'emotion' 
          ? '[data-emotions-container="true"]'
          : '[data-tags-container="true"]';
        const container = document.querySelector(containerSelector);
        
        if (container && !container.contains(target)) {
          console.log(`Global click detected outside ${cellEditingState.editingCell.field} container`);
          // Clear any existing timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          // Add a small delay to prevent multiple rapid calls
          timeoutId = setTimeout(() => {
            handleCellBlur();
          }, 10);
        }
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [cellEditingState.editingCell, handleCellBlur, status.isSaving]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, id: number, field: keyof Trade) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave(id, field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Cancel editing and restore original value
      const newState = handleCellEscape(id, field, cellEditingState);
      setCellEditingState(prev => ({
        ...prev,
        ...newState
      }));
    }
  }, [cellEditingState, handleCellSave]);

  const handleAddTrade = () => {
    setEditingTrade(null);
    setDialogState({ ...dialogState, isTradeDialogOpen: true });
  };

  const handleSaveTrade = async (tradeData: Partial<Trade>) => {
    const result = await saveTrade(tradeData, editingTrade, user);
    
    if (result?.success) {
      setDialogState({ ...dialogState, isTradeDialogOpen: false });
      setEditingTrade(null);
    } else {
      setStatus({ ...status, error: result?.error || "取引の保存中にエラーが発生しました", isSaving: false });
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
      setStatus({ ...status, error: error.message, isSaving: false });
    }
  };

  const handleToggleColumn = (columnId: string, isVisible: boolean) => {
    setTableConfig(prev => ({
      ...prev,
      visibleColumns: isVisible ? [...prev.visibleColumns, columnId] : prev.visibleColumns.filter((id) => id !== columnId),
      hasUnsavedChanges: true
    }));
  };

  const handleDragStart = (columnId: string) => {
    setTableConfig(prev => ({
      ...prev,
      draggedColumn: columnId
    }));
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!tableConfig.draggedColumn || tableConfig.draggedColumn === targetColumnId) {
      setTableConfig(prev => ({
        ...prev,
        draggedColumn: null
      }));
      return;
    }

    const newOrder = [...tableConfig.visibleColumns];
    const draggedIndex = newOrder.indexOf(tableConfig.draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumnId);

    // Remove dragged item from its current position
    newOrder.splice(draggedIndex, 1);
    // Insert it at the target position
    newOrder.splice(targetIndex, 0, tableConfig.draggedColumn);

    setTableConfig(prev => ({
      ...prev,
      visibleColumns: newOrder,
      draggedColumn: null,
      hasUnsavedChanges: true
    }));
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
      tableConfig.visibleColumns.forEach((columnId, index) => {
        const dbField = columnMapping[columnId as keyof typeof columnMapping];
        if (dbField) {
          preferences[dbField] = index + 1; // Convert 0-based to 1-based
        }
      });

      // Set null for hidden columns
      allColumns.forEach((column) => {
        const dbField = columnMapping[column.id as keyof typeof columnMapping];
        if (dbField && !tableConfig.visibleColumns.includes(column.id)) {
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
      
      setTableConfig(prev => ({
        ...prev,
        hasUnsavedChanges: false
      }));
      setDialogState({ ...dialogState, isTableSettingsOpen: false });
    } catch (error) {
      console.error("Error saving column preferences:", error);
    }
  };

  const handleCloseSettings = () => {
    if (tableConfig.hasUnsavedChanges) {
      setDialogState({ ...dialogState, showDiscardWarning: true });
    } else {
      setDialogState({ ...dialogState, isTableSettingsOpen: false });
    }
  };

  const handleDiscardChanges = () => {
    setTableConfig(prev => ({
      ...prev,
      visibleColumns: prev.originalVisibleColumns,
      hasUnsavedChanges: false
    }));
    setDialogState({ ...dialogState, showDiscardWarning: false });
    setDialogState({ ...dialogState, isTableSettingsOpen: false });
  };

  const handleCancelDiscard = () => {
    setDialogState({ ...dialogState, showDiscardWarning: false });
  };

  const handleSort = (key: keyof Trade) => {
    setTableConfig(prev => {
      if (prev.sortConfig.key === key) {
        // If clicking the same column, cycle through: asc -> desc -> none
        if (prev.sortConfig.direction === 'asc') {
          return {
            ...prev,
            sortConfig: {
              key,
              direction: 'desc'
            }
          };
        } else if (prev.sortConfig.direction === 'desc') {
          return {
            ...prev,
            sortConfig: {
              key: null,
              direction: 'asc'
            }
          };
        }
      }
      // If clicking a different column, set it as the new sort key with ascending direction
      return {
        ...prev,
        sortConfig: {
          key,
          direction: 'asc'
        }
      };
    });
  };

  const getSortIcon = (columnId: string) => {
    if (tableConfig.sortConfig.key !== columnId) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return tableConfig.sortConfig.direction === 'asc' 
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

  const getColumnDisplayValue = (trade: Trade, columnId: string) => {
    const value = getColumnValue(trade, columnId, allColumns);
    
    // Handle JSX rendering for arrays
    if (columnId === "tags" && Array.isArray(value)) {
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
    if (columnId === "emotion" && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((emotion, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {emotion}
            </Badge>
          ))}
        </div>
      );
    }
    return value;
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
          {status.loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : status.error ? (
            <div className="text-center text-red-600 py-10">{status.error}</div>
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
                    setTableConfig(prev => ({
                      ...prev,
                      originalVisibleColumns: prev.visibleColumns,
                      hasUnsavedChanges: false
                    }));
                    setDialogState({ ...dialogState, isTableSettingsOpen: true });
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
                          {tableConfig.visibleColumns.map((colId) => {
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
                              {tableConfig.visibleColumns.map((colId) => {
                                const column = allColumns.find((c) => c.id === colId);
                                if (!column) return null;

                                const isEditing = cellEditingState.editingCell?.id === trade.id && cellEditingState.editingCell.field === column.id;
                                const cellKey = `${trade.id}-${column.id}`;
                                const editingValue = cellEditingState.editingValues[cellKey];
                                const isSaving = cellEditingState.savingCells.has(cellKey);
                                const cellError = cellEditingState.cellErrors[cellKey];
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
                                                  <SelectItem value="no-symbols" disabled>シンボルがありません</SelectItem>
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
                                            onChange={(e) => handleCellChange(trade.id, column.id as keyof Trade, e.target.value)}
                                            onBlur={(e) => {
                                              if (!isComposing) handleCellBlur();
                                            }}
                                            onKeyDown={(e) => {
                                              if (isComposing) return;
                                              handleCellKeyDown(e, trade.id, column.id as keyof Trade);
                                            }}
                                            onCompositionStart={() => setIsComposing(true)}
                                            onCompositionEnd={() => setIsComposing(false)}
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
                                            disabled={status.isSaving}
                                          />
                                        ) : column.id === "holdingTime" ? (
                                          <div className="flex gap-1" onBlur={(e) => {
                                            // Only blur if clicking outside the entire holding time container
                                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                              handleCellBlur();
                                            }
                                          }}>
                                            <Input
                                              type="number"
                                              min="0"
                                              max="365"
                                              placeholder="日"
                                              value={cellEditingState.editingValues[`${trade.id}-holdingDays`] || ""}
                                              onChange={(e) => {
                                                const days = e.target.value ? parseInt(e.target.value) : 0;
                                                const hours = cellEditingState.editingValues[`${trade.id}-holdingHours`] || 0;
                                                const minutes = cellEditingState.editingValues[`${trade.id}-holdingMinutes`] || 0;
                                                const seconds = cellEditingState.editingValues[`${trade.id}-holdingSeconds`] || 0;
                                                const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                                                handleCellChange(trade.id, column.id as keyof Trade, totalSeconds);
                                              }}
                                              onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                              className="w-12 h-8 text-xs no-spinner"
                                              disabled={status.isSaving}
                                            />
                                            <Input
                                              type="number"
                                              min="0"
                                              max="23"
                                              placeholder="時"
                                              value={cellEditingState.editingValues[`${trade.id}-holdingHours`] || ""}
                                              onChange={(e) => {
                                                const days = cellEditingState.editingValues[`${trade.id}-holdingDays`] || 0;
                                                const hours = e.target.value ? parseInt(e.target.value) : 0;
                                                const minutes = cellEditingState.editingValues[`${trade.id}-holdingMinutes`] || 0;
                                                const seconds = cellEditingState.editingValues[`${trade.id}-holdingSeconds`] || 0;
                                                const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                                                handleCellChange(trade.id, column.id as keyof Trade, totalSeconds);
                                              }}
                                              onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                              className="w-12 h-8 text-xs no-spinner"
                                              disabled={status.isSaving}
                                            />
                                            <Input
                                              type="number"
                                              min="0"
                                              max="59"
                                              placeholder="分"
                                              value={cellEditingState.editingValues[`${trade.id}-holdingMinutes`] || ""}
                                              onChange={(e) => {
                                                const days = cellEditingState.editingValues[`${trade.id}-holdingDays`] || 0;
                                                const hours = cellEditingState.editingValues[`${trade.id}-holdingHours`] || 0;
                                                const minutes = e.target.value ? parseInt(e.target.value) : 0;
                                                const seconds = cellEditingState.editingValues[`${trade.id}-holdingSeconds`] || 0;
                                                const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                                                handleCellChange(trade.id, column.id as keyof Trade, totalSeconds);
                                              }}
                                              onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                              className="w-12 h-8 text-xs no-spinner"
                                              disabled={status.isSaving}
                                            />
                                            <Input
                                              type="number"
                                              min="0"
                                              max="59"
                                              placeholder="秒"
                                              value={cellEditingState.editingValues[`${trade.id}-holdingSeconds`] || ""}
                                              onChange={(e) => {
                                                const days = cellEditingState.editingValues[`${trade.id}-holdingDays`] || 0;
                                                const hours = cellEditingState.editingValues[`${trade.id}-holdingHours`] || 0;
                                                const minutes = cellEditingState.editingValues[`${trade.id}-holdingMinutes`] || 0;
                                                const seconds = e.target.value ? parseInt(e.target.value) : 0;
                                                const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
                                                handleCellChange(trade.id, column.id as keyof Trade, totalSeconds);
                                              }}
                                              onKeyDown={(e) => handleCellKeyDown(e, trade.id, column.id as keyof Trade)}
                                              className="w-12 h-8 text-xs no-spinner"
                                              disabled={status.isSaving}
                                            />
                                          </div>
                                        ) : column.type === "emotions" ? (
                                          <div 
                                            className="space-y-2" 
                                            data-emotions-container="true"
                                            tabIndex={-1}
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={handleCellBlur}
                                          >
                                            <div className="mb-2">
                                              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto border rounded p-2">
                                                {availableEmotions.map((emotion, index) => (
                                                  <Badge
                                                    key={index}
                                                    variant={Array.isArray(value) && value.includes(emotion) ? "default" : "outline"}
                                                    className="cursor-pointer text-xs"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      const currentEmotions = Array.isArray(value) ? value : [];
                                                      if (currentEmotions.includes(emotion)) {
                                                        // Remove emotion if already selected
                                                        const newEmotions = currentEmotions.filter((e: string) => e !== emotion);
                                                        handleCellChange(trade.id, column.id as keyof Trade, newEmotions);
                                                      } else {
                                                        // Add emotion if not selected
                                                        const newEmotions = [...currentEmotions, emotion];
                                                        handleCellChange(trade.id, column.id as keyof Trade, newEmotions);
                                                      }
                                                    }}
                                                  >
                                                    {emotion}
                                                  </Badge>
                                                ))}
                                                {availableEmotions.length === 0 && (
                                                  <div className="text-xs text-muted-foreground">感情がありません</div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ) : column.type === "tags" ? (
                                          <div
                                            className="space-y-2"
                                            data-tags-container="true"
                                            tabIndex={-1}
                                            onClick={e => e.stopPropagation()}
                                            onBlur={handleCellBlur}
                                          >
                                            <div className="mb-2">
                                              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto border rounded p-2">
                                                {availableTags.map((tag, index) => (
                                                  <Badge
                                                    key={index}
                                                    variant={Array.isArray(value) && value.includes(tag.tag_name) ? "default" : "outline"}
                                                    className="cursor-pointer text-xs"
                                                    onClick={e => {
                                                      e.stopPropagation();
                                                      const currentTags = Array.isArray(value) ? value : [];
                                                      if (currentTags.includes(tag.tag_name)) {
                                                        // Remove tag if already selected
                                                        const newTags = currentTags.filter((t: string) => t !== tag.tag_name);
                                                        handleCellChange(trade.id, column.id as keyof Trade, newTags);
                                                      } else {
                                                        // Add tag if not selected
                                                        const newTags = [...currentTags, tag.tag_name];
                                                        handleCellChange(trade.id, column.id as keyof Trade, newTags);
                                                      }
                                                    }}
                                                  >
                                                    {tag.tag_name}
                                                  </Badge>
                                                ))}
                                                {availableTags.length === 0 && (
                                                  <div className="text-xs text-muted-foreground">タグがありません</div>
                                                )}
                                              </div>
                                            </div>
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
                                            disabled={status.isSaving}
                                          />
                                        )}
                                        {status.isSaving && (
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
                                            {getColumnDisplayValue(trade, column.id)}
                                          </span>
                                          {!isFieldEditable(column.id as keyof Trade) && column.id !== "tags" && (
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
                              colSpan={tableConfig.visibleColumns.length + 1}
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
          isOpen={dialogState.isTradeDialogOpen}
          onClose={() => setDialogState({ ...dialogState, isTradeDialogOpen: false })}
          onSave={handleSaveTrade}
          defaultDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
          user={user}
          availableTags={availableTags}
        />

        <TableSettingsDialog
          isOpen={dialogState.isTableSettingsOpen}
          onClose={handleCloseSettings}
          visibleColumns={tableConfig.visibleColumns}
          onToggleColumn={handleToggleColumn}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onSave={saveColumnPreferences}
          draggedColumn={tableConfig.draggedColumn}
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

        <AlertDialog open={dialogState.showDiscardWarning} onOpenChange={(open) => setDialogState({ ...dialogState, showDiscardWarning: open })}>
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
