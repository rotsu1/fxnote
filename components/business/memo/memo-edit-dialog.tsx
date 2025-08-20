import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";

export function MemoEditDialog({
    memo,
    isOpen,
    onClose,
    onSave,
    showExitWarning,
    setShowExitWarning,
    originalFormData,
    onResetForm,
  }: {
    memo: any
    isOpen: boolean
    onClose: () => void
    onSave: (memo: any) => void
    showExitWarning: boolean
    setShowExitWarning: (show: boolean) => void
    originalFormData: any
    onResetForm: () => void
  }) {
    const [formData, setFormData] = useState<{
      title: string;
      content: string;
      note_date: Date | undefined;
    }>(
      memo ? {
        title: memo.title || "",
        content: memo.content || "",
        note_date: memo.note_date ? new Date(memo.note_date) : new Date(),
      } : {
        title: "",
        content: "",
        note_date: new Date(),
      },
    )
  
    // Sync formData when memo prop changes
    useEffect(() => {
      if (memo) {
        // Editing existing memo
        setFormData({
          title: memo.title || "",
          content: memo.content || "",
          note_date: memo.note_date ? new Date(memo.note_date) : new Date(),
        });
      } else {
        // Creating new memo - ensure form is completely empty
        setFormData({
          title: "",
          content: "",
          note_date: new Date(),
        });
      }
    }, [memo])
  
    // Reset form when dialog closes
    useEffect(() => {
      if (!isOpen) {
        // Reset form data when dialog closes
        setFormData({
          title: "",
          content: "",
          note_date: new Date(),
        });
      }
    }, [isOpen])
  
    // Cleanup effect to reset form when component unmounts or memo changes
    useEffect(() => {
      return () => {
        // Reset form data when component unmounts
        setFormData({
          title: "",
          content: "",
          note_date: new Date(),
        });
      };
    }, [])
  
    // Check if form has been modified
    const hasFormChanged = () => {
      if (!originalFormData) return false;
      
      // For new memos, check if user has entered any content
      if (!memo) {
        return (
          formData.title.trim() !== "" ||
          formData.content.trim() !== ""
        );
      }
      
      // For existing memos, check if values have changed
      return (
        formData.title !== originalFormData.title ||
        formData.content !== originalFormData.content ||
        (formData.note_date && originalFormData.note_date && 
         formData.note_date.getTime() !== originalFormData.note_date.getTime()) ||
        (!formData.note_date && originalFormData.note_date) ||
        (formData.note_date && !originalFormData.note_date)
      );
    };
  
    // Handle close with warning if changes were made
    const handleClose = () => {
      if (hasFormChanged()) {
        setShowExitWarning(true);
      } else {
        // Reset form data before closing
        setFormData({
          title: "",
          content: "",
          note_date: new Date(),
        });
        onClose();
      }
    };
  
    // Reset form data to original state
    const resetFormData = () => {
      if (originalFormData) {
        setFormData({
          title: originalFormData.title,
          content: originalFormData.content,
          note_date: originalFormData.note_date,
        });
      }
      onResetForm();
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{memo ? "メモ編集" : "新規メモ"}</DialogTitle>
          </DialogHeader>
  
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="メモのタイトルを入力"
              />
            </div>
  
            <div>
              <Label htmlFor="date">日付</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.note_date instanceof Date ? (
                      format(formData.note_date, "PPP", { locale: ja })
                    ) : (
                      <span>日付を選択</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.note_date instanceof Date ? formData.note_date : undefined}
                    onSelect={(date) => setFormData({ ...formData, note_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
  
            <div>
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="メモの内容を入力"
                rows={8}
              />
            </div>
          </div>
  
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
            <Button onClick={() => onSave(formData)}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }