"use client";

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Trade } from "@/utils/core/types";
import { EditableCell } from "./editable-cell";

interface TableRowProps {
  trade: Trade;
  selectedTrades: Set<number>;
  tableConfig: any;
  allColumns: any[];
  cellEditingState: any;
  availableSymbols: string[];
  availableEmotions: string[];
  availableTags: any[];
  status: any;
  isFieldEditable: (field: keyof Trade) => boolean;
  handleSelectTrade: (id: number, checked: boolean) => void;
  handleCellClick: (id: number, field: keyof Trade) => void;
  handleCellChange: (id: number, field: keyof Trade, value: any) => void;
  handleCellBlur: () => void;
  handleCellKeyDown: (e: React.KeyboardEvent, id: number, field: keyof Trade) => void;
  getColumnDisplayValue: (trade: Trade, columnId: string) => string | string[] | React.JSX.Element;
}

export function TradeTableRow({
  trade,
  selectedTrades,
  tableConfig,
  allColumns,
  cellEditingState,
  availableSymbols,
  availableEmotions,
  availableTags,
  status,
  isFieldEditable,
  handleSelectTrade,
  handleCellClick,
  handleCellChange,
  handleCellBlur,
  handleCellKeyDown,
  getColumnDisplayValue,
}: TableRowProps) {

  return (
    <TableRow key={trade.id}>
      <TableCell className="py-2 px-4 border-b text-center min-w-[50px]">
        <Checkbox
          checked={selectedTrades.has(trade.id)}
          onCheckedChange={(checked) => handleSelectTrade(trade.id, checked as boolean)}
        />
      </TableCell>
      {tableConfig.visibleColumns.map((colId: string) => {
        const column = allColumns.find((c) => c.id === colId);
        if (!column) return null;

        const isEditing = cellEditingState.editingCell?.id === trade.id && cellEditingState.editingCell?.field === column.id;
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
              <EditableCell
                trade={trade}
                column={column}
                value={value}
                isEditing={isEditing}
                isSaving={isSaving}
                cellError={cellError}
                cellEditingState={cellEditingState}
                availableSymbols={availableSymbols}
                availableEmotions={availableEmotions}
                availableTags={availableTags}
                status={status}
                onCellChange={handleCellChange}
                onCellBlur={handleCellBlur}
                onCellKeyDown={handleCellKeyDown}
              />
            ) : (
              <div className="flex items-center gap-2">
                {(['entryTime','exitTime'].includes(column.id)) ? (
                  (() => {
                    const strVal = String(trade[column.id as keyof Trade] || "");
                    const hasT = strVal.includes("T");
                    const rawDate = hasT ? strVal.split("T")[0] : (strVal.split(" ")[0] || "");
                    let timePart = hasT ? strVal.split("T")[1] : (strVal.split(" ")[1] || "");
                    if (timePart && timePart.length === 5) timePart = `${timePart}:00`;
                    const datePart = rawDate || trade.date || "";
                    return (
                      <span className="block min-h-[24px] py-1 flex-1 truncate">
                        {datePart}{timePart ? ` ${timePart.substring(0,8)}` : ''}
                      </span>
                    );
                  })()
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
                      "block min-h-[24px] py-1 flex-1",
                    )}
                  >
                    {(() => {
                      const displayValue = getColumnDisplayValue(trade, column.id);
                      if (typeof displayValue === 'string') {
                        return displayValue;
                      } else if (Array.isArray(displayValue)) {
                        return displayValue.join(', ');
                      } else {
                        return displayValue;
                      }
                    })()}
                  </span>
                )}
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
  );
}
