import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/business/common/alert-dialog"

export function DisplaySettingsDialog({ 
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
      <ConfirmDialog
        open={showDiscardWarning}
        onOpenChange={setShowDiscardWarning}
        title="設定を破棄しますか？"
        description={
          <>
            <span className="mb-2">
              保存されていない設定変更があります。
            </span>
            <span className="text-red-600">
              ⚠️ 現在の設定変更は破棄されます。
            </span>
            <span className="text-sm text-muted-foreground mt-2">
              この操作は取り消すことができません。
            </span>
          </>
        }
        onConfirm={handleDiscard}
      />
    </>
  )
}