"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Trade } from "@/utils/core/types";

interface EditableCellProps {
  trade: Trade;
  column: any;
  value: any;
  isEditing: boolean;
  isSaving: boolean;
  cellError?: string;
  cellEditingState: any;
  availableSymbols: string[];
  availableEmotions: string[];
  availableTags: any[];
  status: any;
  onCellChange: (id: number, field: keyof Trade, value: any) => void;
  onCellBlur: () => void;
  onCellKeyDown: (e: React.KeyboardEvent, id: number, field: keyof Trade) => void;
}

export function EditableCell({
  trade,
  column,
  value,
  isEditing,
  isSaving,
  cellError,
  cellEditingState,
  availableSymbols,
  availableEmotions,
  availableTags,
  status,
  onCellChange,
  onCellBlur,
  onCellKeyDown,
}: EditableCellProps) {
  const [isComposing, setIsComposing] = useState(false);

  if (!isEditing) {
    return null;
  }

  return (
    <div className="space-y-1">
      {column.type === "select" ? (
        column.id === "pair" ? (
          // Custom single-select with free input and suggestions for symbol
          <div
            className="relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                onCellBlur();
              }
            }}
          >
            <Input
              value={String(value || "")}
              placeholder="シンボルを入力"
              onChange={(e) => onCellChange(trade.id, column.id as keyof Trade, e.target.value)}
              onKeyDown={(e) => onCellKeyDown(e, trade.id, column.id as keyof Trade)}
              autoFocus
              className={cn(
                "h-8",
                cellError && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {availableSymbols.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-background shadow">
                {(() => {
                  const q = String(value || "").toLowerCase();
                  const list = Array.from(new Set(availableSymbols))
                    .filter((s) => !q || s.toLowerCase().includes(q))
                    .slice(0, 20);
                  if (list.length === 0) {
                    return (
                      <div className="px-2 py-1 text-xs text-muted-foreground">候補がありません</div>
                    );
                  }
                  return list.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-muted"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onCellChange(trade.id, column.id as keyof Trade, s);
                        onCellBlur();
                      }}
                    >
                      {s}
                    </button>
                  ));
                })()}
              </div>
            )}
          </div>
        ) : (
        <Select
          value={String(value)}
          onValueChange={(val) => onCellChange(trade.id, column.id as keyof Trade, val)}
          onOpenChange={(open) => !open && onCellBlur()}
        >
          <SelectTrigger className={cn(
            "h-8",
            cellError && "border-red-500 focus-visible:ring-red-500"
          )}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              // For other select fields, use column options
              (column.options || []).map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        )
      ) : column.type === "textarea" ? (
        <Textarea
          value={String(value)}
          onChange={(e) => onCellChange(trade.id, column.id as keyof Trade, e.target.value)}
          onBlur={(e) => {
            if (!isComposing) onCellBlur();
          }}
          onKeyDown={(e) => {
            if (isComposing) return;
            onCellKeyDown(e, trade.id, column.id as keyof Trade);
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          autoFocus
          rows={2}
          className={cn(
            "min-w-[150px]",
            cellError && "border-red-500 focus-visible:ring-red-500"
          )}
        />
      ) : column.id === "entryTime" || column.id === "exitTime" ? (
        <div className="flex gap-2" onBlur={(e) => {
          // Only blur if clicking outside the entire datetime container
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onCellBlur();
          }
        }}>
          {(() => {
            const strVal = String(value || "");
            const hasT = strVal.includes("T");
            const rawDate = hasT ? strVal.split("T")[0] : (strVal.split(" ")[0] || "");
            let timePart = hasT ? strVal.split("T")[1] : (strVal.split(" ")[1] || "");
            // Normalize time to HH:MM:SS only if present
            if (timePart && timePart.length === 5) timePart = `${timePart}:00`;
            const datePart = rawDate || trade.date || "";
            return (
              <>
                <Input
                  type="date"
                  value={datePart}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    // If time missing, keep date-only; do not force 00:00:00
                    const combined = newDate ? (timePart ? `${newDate}T${timePart}` : `${newDate}`) : '';
                    onCellChange(trade.id, column.id as keyof Trade, combined);
                  }}
                  onKeyDown={(e) => onCellKeyDown(e, trade.id, column.id as keyof Trade)}
                  autoFocus
                  className={cn(
                    "h-8",
                    cellError && "border-red-500 focus-visible:ring-red-500"
                  )}
                  disabled={status.isSaving}
                />
                <Input
                  type="time"
                  step="1"
                  value={timePart || ""}
                  placeholder="--:--:--"
                  onChange={(e) => {
                    let newTime = e.target.value;
                    if (newTime && newTime.length === 5) newTime = `${newTime}:00`;
                    const usedDate = datePart || trade.date || "";
                    const combined = usedDate ? `${usedDate}T${newTime || ""}` : '';
                    onCellChange(trade.id, column.id as keyof Trade, combined);
                  }}
                  onKeyDown={(e) => onCellKeyDown(e, trade.id, column.id as keyof Trade)}
                  className={cn(
                    "h-8",
                    cellError && "border-red-500 focus-visible:ring-red-500"
                  )}
                  disabled={status.isSaving}
                />
              </>
            );
          })()}
        </div>
      ) : column.id === "holdingTime" ? (
        <div className="flex gap-1" onBlur={(e) => {
          // Only blur if clicking outside the entire holding time container
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onCellBlur();
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
              onCellChange(trade.id, column.id as keyof Trade, totalSeconds);
            }}
            onWheel={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => onCellKeyDown(e, trade.id, column.id as keyof Trade)}
            className={cn(
              "w-12 h-8 text-xs no-spinner",
              cellError && "border-red-500 focus-visible:ring-red-500"
            )}
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
              onCellChange(trade.id, column.id as keyof Trade, totalSeconds);
            }}
            onWheel={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => onCellKeyDown(e, trade.id, column.id as keyof Trade)}
            className={cn(
              "w-12 h-8 text-xs no-spinner",
              cellError && "border-red-500 focus-visible:ring-red-500"
            )}
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
              onCellChange(trade.id, column.id as keyof Trade, totalSeconds);
            }}
            onWheel={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => onCellKeyDown(e, trade.id, column.id as keyof Trade)}
            className={cn(
              "w-12 h-8 text-xs no-spinner",
              cellError && "border-red-500 focus-visible:ring-red-500"
            )}
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
              onCellChange(trade.id, column.id as keyof Trade, totalSeconds);
            }}
            onWheel={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => onCellKeyDown(e, trade.id, column.id as keyof Trade)}
            className={cn(
              "w-12 h-8 text-xs no-spinner",
              cellError && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={status.isSaving}
          />
        </div>
      ) : column.type === "emotions" ? (
        <div 
          className="space-y-2" 
          data-emotions-container="true"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          onBlur={onCellBlur}
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
                      onCellChange(trade.id, column.id as keyof Trade, newEmotions);
                    } else {
                      // Add emotion if not selected
                      const newEmotions = [...currentEmotions, emotion];
                      onCellChange(trade.id, column.id as keyof Trade, newEmotions);
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
          onBlur={onCellBlur}
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
                      onCellChange(trade.id, column.id as keyof Trade, newTags);
                    } else {
                      // Add tag if not selected
                      const newTags = [...currentTags, tag.tag_name];
                      onCellChange(trade.id, column.id as keyof Trade, newTags);
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
            onCellChange(trade.id, column.id as keyof Trade, e.target.value)
          }
          onBlur={onCellBlur}
          onKeyDown={(e) => onCellKeyDown(e, trade.id, column.id as keyof Trade)}
          autoFocus
          className={cn(
            "h-8",
            (column.id === "profit" || column.id === "lot" || column.id === "entry" || column.id === "exit" || column.id === "pips") && "no-spinner",
            cellError && "border-red-500 focus-visible:ring-red-500"
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
  );
}
