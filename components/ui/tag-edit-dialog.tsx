"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Badge } from "./badge"
import { Tag, Plus } from "lucide-react"

interface TagEditDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  addLabel: string
  placeholder: string
  availableItems: string[]
  newItem: string
  onNewItemChange: (value: string) => void
  onAddItem: (item: string) => void
  onDeleteItem: (item: string) => void
  error?: string
  icon?: "tag" | "plus"
  emptyMessage: string
  helpText: string
}

export function TagEditDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  addLabel,
  placeholder,
  availableItems,
  newItem,
  onNewItemChange,
  onAddItem,
  onDeleteItem,
  error,
  icon = "tag",
  emptyMessage,
  helpText
}: TagEditDialogProps) {
  const IconComponent = icon === "tag" ? Tag : Plus

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new item */}
          <div>
            <Label htmlFor="newItemInput">{addLabel}</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="newItemInput"
                placeholder={placeholder}
                value={newItem}
                onChange={(e) => onNewItemChange(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && onAddItem(newItem)}
              />
              <Button type="button" onClick={() => onAddItem(newItem)} size="sm">
                <IconComponent className="h-4 w-4" />
              </Button>
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* All available items with delete option */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">利用可能な{title === "タグ管理" ? "タグ" : "感情"}:</Label>
            <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto border rounded p-2">
              {availableItems.length > 0 ? (
                availableItems.map((item, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer text-xs hover:bg-red-50 hover:border-red-300"
                    onClick={() => onDeleteItem(item)}
                  >
                    {item} ×
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">{emptyMessage}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {helpText}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
