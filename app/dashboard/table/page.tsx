"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"

import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

import { CardDescription } from "@/components/ui/card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/business/common/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
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
  AppSidebar,
  useSidebar
} from "@/components/ui/sidebar"
import {
  TableSettingsDialog,
  allColumns
} from "@/components/business/table/table-settings-dialog"
import { TradeEditDialog } from "@/components/business/common/trade-edit-dialog"
import { TableActions } from "@/components/business/table/table-header"
import { TradeTableRow } from "@/components/business/table/table-row"

import { Trade } from "@/utils/core/types"
import { isFieldEditable, getColumnValue, transformTradeData } from "@/utils/table/tableUtils"
import { loadTags, loadSymbolsForTable, loadEmotionsForTable } from "@/utils/data/dataLoadingUtils"
import { filterAndSortTrades } from "@/utils/table/tableFilterUtils"
import { handleCellClickLogic, handleHoldingTimeChange, handleCellEscape, handleCellBlurLogic } from "@/utils/table/cellEditingUtils"
import { saveCellValue } from "@/utils/table/cellSaveUtils"
import { handleTradeSelection, handleSelectAllTrades as handleSelectAllTradesUtil, handleTradeSave, handleTradeDeletion } from "@/utils/trading/tradeManagementUtils"
import { handleColumnToggle, handleColumnDragStart, handleColumnDrop, saveColumnPreferences as saveColumnPreferencesUtil } from "@/utils/table/columnManagementUtils"
import { handlePreviousDay as handlePreviousDayUtil, handleNextDay as handleNextDayUtil } from "@/utils/ui/dateNavigationUtils"

import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

function TableContent() {
  const user = useAuth();
  const { state: sidebarState, isMobile } = useSidebar();
  
  // Calculate dynamic width based on sidebar state and screen size
  const getTableWidth = () => {
    if (isMobile) {
      // On mobile, sidebar is completely hidden, use full viewport width
      return "w-full max-w-[calc(100vw)]";
    } else if (sidebarState === "collapsed") {
      // On desktop, sidebar is collapsed but still visible (showing icons)
      return "w-full max-w-[calc(100vw-50px)]";
    } else {
      // On desktop, sidebar is expanded
      return "w-full max-w-[calc(100vw-250px)]";
    }
  };

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

  const filteredTrades = useMemo(() => {
    return filterAndSortTrades(trades, {
      selectedDate,
      sortConfig: tableConfig.sortConfig
    });
  }, [trades, selectedDate, tableConfig.sortConfig]);

  const handleCellClick = (id: number, field: keyof Trade) => {
    const trade = trades.find(t => t.id === id);
    if (!trade) return;
    
    // Clear any existing errors for this cell when starting to edit
    const cellKey = `${id}-${field}`;
    if (cellEditingState.cellErrors[cellKey]) {
      setCellEditingState(prev => ({
        ...prev,
        cellErrors: {
          ...prev.cellErrors,
          [cellKey]: ""
        }
      }));
    }
    
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
    }));
  }, [cellEditingState]);

  const handleCellSave = useCallback(async (id: number, field: keyof Trade) => {
    const cellKey = `${id}-${field}`;
    const value = cellEditingState.editingValues[cellKey];
    const originalValue = cellEditingState.originalValues[cellKey];
    
    if (value === undefined) {
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
      // Set error state but clear editing state to prevent infinite loops
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
        },
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
    
    // If changes were made, validate before saving
    if (result.shouldSave && cellEditingState.editingCell) {
      const { id, field } = cellEditingState.editingCell;
      const cellKey = `${id}-${field}`;
      const cellError = cellEditingState.cellErrors[cellKey];
      
      // Don't save if there's a validation error - restore original value instead
      if (cellError && ['lot', 'entry', 'exit', 'pips', 'profit'].includes(field)) {
        const originalValue = cellEditingState.originalValues[cellKey];
        
        // Restore the original value
        setTrades(prevTrades => 
          prevTrades.map(trade => 
            trade.id === id ? { ...trade, [field]: originalValue } : trade
          )
        );
        
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
          },
          cellErrors: {
            ...prev.cellErrors,
            [cellKey]: ""
          }
        }));
        
        return;
      }
      
      // Capture the editing cell info before it gets cleared
      const editingCellId = cellEditingState.editingCell.id;
      const editingCellField = cellEditingState.editingCell.field;
      
      setStatus(prevStatus => ({ ...prevStatus, isSaving: true }));
      handleCellSave(editingCellId, editingCellField);
    }
  }, [cellEditingState, status.isSaving, handleCellSave]);

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
    const result = await handleTradeSave(tradeData, editingTrade, user);
    
    if (result.success) {
      setDialogState({ ...dialogState, isTradeDialogOpen: false });
      setEditingTrade(null);
    } else {
      setStatus({ ...status, error: result.error || "取引の保存中にエラーが発生しました", isSaving: false });
    }
  };

  const handleSelectTrade = (id: number, checked: boolean) => {
    const newSelectedTrades = handleTradeSelection(id, checked, selectedTrades);
    setSelectedTrades(newSelectedTrades);
  };

  const handleSelectAllTrades = (checked: boolean) => {
    const newSelectedTrades = handleSelectAllTradesUtil(checked, filteredTrades);
    setSelectedTrades(newSelectedTrades);
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
        
        const result = await handleTradeDeletion(selectedIds, user);
        
        if (result.success) {
          setTrades((prevTrades) => prevTrades.filter((t) => !selectedIds.includes(t.id)));
          setSelectedTrades(new Set());
        } else {
          throw new Error(result.error);
        }
      } else {
        // Single trade delete
        const result = await handleTradeDeletion([deleteConfirmId], user);
        
        if (result.success) {
          setTrades((prevTrades) => prevTrades.filter((t) => t.id !== deleteConfirmId));
        } else {
          throw new Error(result.error);
        }
      }
      
      setDeleteConfirmId(null);
    } catch (error: any) {
      console.error("Error deleting trade:", error);
      setStatus({ ...status, error: error.message, isSaving: false });
    }
  };

  const handleToggleColumn = (columnId: string, isVisible: boolean) => {
    const result = handleColumnToggle(columnId, isVisible, tableConfig);
    setTableConfig(prev => ({
      ...prev,
      ...result
    }));
  };

  const handleDragStart = (columnId: string) => {
    const result = handleColumnDragStart(columnId, tableConfig);
    setTableConfig(prev => ({
      ...prev,
      draggedColumn: result.draggedColumn
    }));
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    const result = handleColumnDrop(targetColumnId, tableConfig);
    setTableConfig(prev => ({
      ...prev,
      ...result
    }));
  };

  const saveColumnPreferences = async () => {
    if (!user) return;

    const result = await saveColumnPreferencesUtil(tableConfig.visibleColumns, user, allColumns);
    
    if (result.success) {
      setTableConfig(prev => ({
        ...prev,
        hasUnsavedChanges: false
      }));
      setDialogState({ ...dialogState, isTableSettingsOpen: false });
    } else {
      console.error("Error saving column preferences:", result.error);
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
    const newDate = handlePreviousDayUtil(selectedDate);
    if (newDate) {
      setSelectedDate(newDate);
    }
  };

  const handleNextDay = () => {
    const newDate = handleNextDayUtil(selectedDate);
    if (newDate) {
      setSelectedDate(newDate);
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

  // Load all initial data when user changes
  useEffect(() => {
      if (!user) return;
      
      const initializeData = async () => {
        setStatus({ loading: true, error: "", isSaving: false });
        
        try {
          // Load all data in parallel for better performance
          const [tagsResult, symbolsResult, emotionsResult] = await Promise.all([
            loadTags(user.id),
            loadSymbolsForTable(setAvailableSymbols),
            loadEmotionsForTable(user.id, setAvailableEmotions)
          ]);
  
          // Handle tags loading
          if (tagsResult.error) {
            console.error("Error loading tags for table:", tagsResult.error);
            setAvailableTags([]);
          } else {
            setAvailableTags(tagsResult.data);
          }
  
          // Load user's column preferences
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
            .order("entry_date", { ascending: true })
            .order("entry_time", { ascending: true });
  
          if (tradesError) {
            setStatus({ loading: false, error: tradesError.message, isSaving: false });
            setTrades([]);
            return;
          }
  
          // Fetch tags and emotions for all trades in parallel
          const [tagLinksResult, emotionLinksResult] = await Promise.all([
            supabase
              .from("trade_tag_links")
              .select(`
                trade_id,
                trade_tags!inner(tag_name)
              `),
            supabase
              .from("trade_emotion_links")
              .select(`
                trade_id,
                emotions!inner(emotion)
              `)
          ]);
  
          if (tagLinksResult.error) {
            console.error("Error loading tags:", tagLinksResult.error);
          }
  
          if (emotionLinksResult.error) {
            console.error("Error loading emotions:", emotionLinksResult.error);
          }
  
          // Group tags and emotions by trade_id, but only for trades that belong to the current user
          const userTradeIds = new Set((tradesData || []).map(trade => trade.id));
          
          const tagsByTradeId = (tagLinksResult.data || []).reduce((acc: Record<number, string[]>, link: any) => {
            // Only include tags for trades that belong to the current user
            if (userTradeIds.has(link.trade_id)) {
              if (!acc[link.trade_id]) acc[link.trade_id] = [];
              acc[link.trade_id].push(link.trade_tags.tag_name);
            }
            return acc;
          }, {});
  
          const emotionsByTradeId = (emotionLinksResult.data || []).reduce((acc: Record<number, string[]>, link: any) => {
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
          console.error("Error loading data:", error);
          setStatus({ loading: false, error: error.message || "データの読み込み中にエラーが発生しました", isSaving: false });
        } finally {
          setStatus({ loading: false, error: "", isSaving: false });
        }
      };
  
      initializeData();
      
      // Listen for trade updates
      const handleTradeUpdate = () => {
        initializeData();
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

  return (
    <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">取引履歴テーブル</h1>
          </div>
        </header>

        <main className={cn("flex-1 px-4 md:px-6 pt-6", getTableWidth())}>
          {status.loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : status.error ? (
            <div className="text-center text-red-600 py-10">{status.error}</div>
          ) : (
            <>
              <TableActions
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onPreviousDay={handlePreviousDay}
                onNextDay={handleNextDay}
                onAddTrade={handleAddTrade}
                handleDeleteSelectedTrades={handleDeleteSelectedTrades}
                setTableConfig={setTableConfig}
                selectedTrades={selectedTrades}
                setDialogState={setDialogState}
              ></TableActions>

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
                            <TradeTableRow
                              key={trade.id}
                              trade={trade}
                              selectedTrades={selectedTrades}
                              tableConfig={tableConfig}
                              allColumns={allColumns}
                              cellEditingState={cellEditingState}
                              availableSymbols={availableSymbols}
                              availableEmotions={availableEmotions}
                              availableTags={availableTags}
                              status={status}
                              isFieldEditable={isFieldEditable}
                              handleSelectTrade={handleSelectTrade}
                              handleCellClick={handleCellClick}
                              handleCellChange={handleCellChange}
                              handleCellBlur={handleCellBlur}
                              handleCellKeyDown={handleCellKeyDown}
                              getColumnDisplayValue={getColumnDisplayValue}
                            />
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

        <ConfirmDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
          title={deleteConfirmId === -1 ? "選択された取引を削除しますか？" : "取引を削除しますか？"}
          description={deleteConfirmId === -1 
            ? `${selectedTrades.size}件の取引を削除します。この操作は取り消すことができません。`
            : "この操作は取り消すことができません。取引データが完全に削除されます。"
          }
          onConfirm={confirmDelete}
        />

        <ConfirmDialog
          open={dialogState.showDiscardWarning}
          onOpenChange={(open: boolean) => setDialogState({ ...dialogState, showDiscardWarning: open })}
          title="変更を破棄しますか？"
          description="保存されていない変更があります。変更を破棄すると、元の設定に戻ります。"
          onConfirm={handleDiscardChanges}
          onCancel={handleCancelDiscard}
        />
      </SidebarInset>
  );
}

export default function TablePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <TableContent />
    </SidebarProvider>
  );
}
