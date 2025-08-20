import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { GripVertical } from "lucide-react"

// Column definitions for settings and table rendering
export const allColumns = [
    {
        id: "entryTime",
        label: "エントリー時間",
        type: "datetime-local",
        defaultVisible: true,
        minWidth: "min-w-[180px]"
    },
    {
        id: "exitTime",
        label: "エグジット時間",
        type: "datetime-local",
        defaultVisible: true,
        minWidth: "min-w-[180px]"
    },
    {
        id: "pair",
        label: "シンボル",
        type: "select",
        options: [],
        defaultVisible: true,
        minWidth: "min-w-[120px]"
    },
    {
        id: "type",
        label: "種別",
        type: "select",
        options: ["買い", "売り"],
        defaultVisible: true,
        minWidth: "min-w-[100px]",
    },
    {
        id: "lot",
        label: "ロット",
        type: "number",
        defaultVisible: true,
        minWidth: "min-w-[100px]"
    },
    {
        id: "entry",
        label: "エントリー",
        type: "number",
        defaultVisible: true,
        minWidth: "min-w-[140px]"
    },
    {
        id: "exit",
        label: "エグジット",
        type: "number",
        defaultVisible: true,
        minWidth: "min-w-[140px]"
    },
    {
        id: "pips",
        label: "pips",
        type: "number",
        defaultVisible: true,
        minWidth: "min-w-[100px]"
    },
    {
        id: "profit",
        label: "損益 (¥)",
        type: "number",
        defaultVisible: true,
        minWidth: "min-w-[120px]"
    },
    {
        id: "emotion",
        label: "感情",
        type: "emotions",
        defaultVisible: true,
        minWidth: "min-w-[200px]"
    },
    {
        id: "holdingTime",
        label: "保有時間",
        type: "holdingTime",
        defaultVisible: true,
        minWidth: "min-w-[200px]"
    },
    {
        id: "notes",
        label: "メモ",
        type: "textarea",
        defaultVisible: true,
        minWidth: "min-w-[250px]"
    },
    {
        id: "tags",
        label: "タグ",
        type: "tags",
        defaultVisible: true,
        minWidth: "min-w-[200px]"
    },
]

export function TableSettingsDialog({
    isOpen,
    onClose,
    visibleColumns,
    onToggleColumn,
    onDragStart,
    onDragOver,
    onDrop,
    onSave,
    draggedColumn,
}: {
    isOpen: boolean
    onClose: () => void
    visibleColumns: string[]
    onToggleColumn: (columnId: string, isVisible: boolean) => void
    onDragStart: (columnId: string) => void
    onDragOver: (e: React.DragEvent, columnId: string) => void
    onDrop: (targetColumnId: string) => void
    onSave: () => void
    draggedColumn: string | null
}) {
    // Define required columns that cannot be unchecked
    const requiredColumns = ['pair', 'profit'];
    
    // Ensure required columns are always visible
    const allRequiredColumns = requiredColumns.filter(
        col => !visibleColumns.includes(col)
    );
    const finalVisibleColumns = [...visibleColumns, ...allRequiredColumns];
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>表示設定</DialogTitle>
                    <DialogDescription>
                        テーブルに表示する列を選択し、ドラッグ＆ドロップで順序を変更してください。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {finalVisibleColumns.map((columnId) => {
                        const column = allColumns.find((c) => c.id === columnId);
                        if (!column) return null;
                        
                        const isRequired = requiredColumns.includes(columnId);
                        
                        return (
                            <div
                                key={column.id}
                                className={`flex items-center gap-3 p-3 border rounded-lg ${
                                    draggedColumn === column.id
                                        ? 'opacity-50 bg-muted'
                                        : 'bg-background'
                                }`}
                                draggable={true}
                                onDragStart={() => onDragStart(column.id)}
                                onDragOver={(e) => onDragOver(e, column.id)}
                                onDrop={() => onDrop(column.id)}
                            >
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                <Checkbox
                                    id={`col-${column.id}`}
                                    checked={true}
                                    disabled={isRequired}
                                    onCheckedChange={(checked) =>
                                        !isRequired && onToggleColumn(
                                            column.id,
                                            checked as boolean
                                        )
                                    }
                                />
                                <Label
                                    htmlFor={`col-${column.id}`}
                                    className="flex-1 cursor-pointer"
                                >
                                    {column.label}
                                    {isRequired && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                            (必須)
                                        </span>
                                    )}
                                </Label>
                            </div>
                        );
                    })}
                    
                    {/* Hidden columns */}
                    {allColumns
                        .filter((column) => !finalVisibleColumns.includes(column.id))
                        .map((column) => {
                            const isRequired = requiredColumns.includes(column.id);
                            
                            return (
                                <div
                                    key={column.id}
                                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                                >
                                    <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
                                    <Checkbox
                                        id={`col-${column.id}`}
                                        checked={false}
                                        disabled={isRequired}
                                        onCheckedChange={(checked) =>
                                            !isRequired && onToggleColumn(
                                                column.id,
                                                checked as boolean
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor={`col-${column.id}`}
                                        className="flex-1 cursor-pointer"
                                    >
                                        {column.label}
                                        {isRequired && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                (必須)
                                            </span>
                                        )}
                                    </Label>
                                </div>
                            );
                        })}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose}>
                        キャンセル
                    </Button>
                    <Button onClick={onSave}>
                        保存
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}