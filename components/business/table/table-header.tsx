import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Settings, Trash2 } from "lucide-react";

// Define proper types for the component props
interface TableConfig {
  visibleColumns: string[];
  originalVisibleColumns: string[];
  sortConfig: { key: keyof Trade | null; direction: 'asc' | 'desc' };
  draggedColumn: string | null;
  hasUnsavedChanges: boolean;
}

interface DialogState {
  isTradeDialogOpen: boolean;
  isTableSettingsOpen: boolean;
  showDiscardWarning: boolean;
}

interface Trade {
  id: number;
  date: string;
  time: string;
  entryTime?: string;
  exitTime?: string;
  entryDate?: string;
  exitDate?: string;
  pair: string;
  type: "買い" | "売り";
  entry: number | null;
  exit: number | null;
  lot?: number | null;
  pips: number | null;
  profit: number | null;
  emotion: string[];
  holdingTime: number;
  holdingDays?: number;
  holdingHours?: number;
  holdingMinutes?: number;
  holdingSeconds?: number;
  notes?: string;
  tags: string[];
}

interface TableHeaderProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onAddTrade: () => void;
  handleDeleteSelectedTrades: () => void;
  setTableConfig: (config: TableConfig | ((prev: TableConfig) => TableConfig)) => void;
  selectedTrades: Set<number>;
  setDialogState: (state: DialogState | ((prev: DialogState) => DialogState)) => void;
}

export function TableActions({ 
  selectedDate, 
  onDateChange, 
  onPreviousDay, 
  onNextDay,
  onAddTrade,
  handleDeleteSelectedTrades,
  setTableConfig,
  selectedTrades,
  setDialogState
}: TableHeaderProps) {
  
  const handleSettingsClick = () => {
    setTableConfig(prev => ({
      ...prev,
      originalVisibleColumns: prev.visibleColumns,
      hasUnsavedChanges: false
    }));
    setDialogState(prev => ({ ...prev, isTableSettingsOpen: true }));
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPreviousDay}
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
            <Calendar 
              mode="single" 
              selected={selectedDate} 
              onSelect={onDateChange} 
              initialFocus 
              locale={ja} 
            />
          </PopoverContent>
        </Popover>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onNextDay}
          disabled={!selectedDate}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={onAddTrade}>
          <Plus className="mr-2 h-4 w-4" />
          取引を追加
        </Button>
        {selectedTrades.size > 0 && (
          <Button variant="destructive" onClick={handleDeleteSelectedTrades}>
            <Trash2 className="mr-2 h-4 w-4" />
            {selectedTrades.size}件削除
          </Button>
        )}
        <Button variant="outline" onClick={handleSettingsClick}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">設定</span>
        </Button>
      </div>
    </div>
  );
}