"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Grid3X3,
  MoreHorizontal,
  CalendarIcon,
  Filter,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

function MemoCard({
  memo,
  onEdit,
  onDelete,
}: {
  memo: any
  onEdit: (memo: any) => void
  onDelete: (id: number) => void
}) {
  const truncateContent = (content: string, maxLength = 120) => {
    return content.length > maxLength ? content.substring(0, maxLength) + "..." : content
  }

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium line-clamp-2">{memo.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(memo)}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(memo.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-xs text-muted-foreground">
          {memo.note_date ? format(new Date(memo.note_date), "yyyy/MM/dd", { locale: ja }) : memo.date}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-4">{truncateContent(memo.content)}</p>
      </CardContent>
    </Card>
  )
}

function MemoEditDialog({
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
    setFormData(
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
  }, [memo])

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

function LayoutSettingsDialog({
  isOpen,
  onClose,
  columns,
  onColumnsChange,
}: {
  isOpen: boolean
  onClose: () => void
  columns: number
  onColumnsChange: (columns: number) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>表示設定</DialogTitle>
          <DialogDescription>メモ一覧の表示方法を設定します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>列数</Label>
            <Select value={columns.toString()} onValueChange={(value) => onColumnsChange(Number.parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1列</SelectItem>
                <SelectItem value="2">2列</SelectItem>
                <SelectItem value="3">3列</SelectItem>
                <SelectItem value="4">4列</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={onClose}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function MemoPage() {
  const user = useAuth();
  const [memos, setMemos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated_at_desc");
  const [columns, setColumns] = useState(3);
  const [editingMemo, setEditingMemo] = useState<any>(null);
  const [isMemoDialogOpen, setIsMemoDialogOpen] = useState(false);
  const [isLayoutSettingsOpen, setIsLayoutSettingsOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<any>(null);



  useEffect(() => {
    if (!user) return;
    
    const fetchNotes = async () => {
      try {
        // Fetch all notes
        const { data: notesData, error: notesError } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (notesError) throw notesError;

        // Process notes with dates
        const processedNotes = notesData?.map(note => ({
          ...note,
          note_date: note.note_date ? new Date(note.note_date) : null
        })) || [];
 
        setMemos(processedNotes);
      } catch (error: any) {
        console.error("Error fetching notes:", error);
        setMemos([]);
      }
    };

    fetchNotes();
  }, [user]);

  // Filter memos based on search
  const filteredMemos = memos.filter((memo) => {
    const matchesSearch =
      memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Sort filtered memos
  const sortedMemos = [...filteredMemos].sort((a, b) => {
    switch (sortBy) {
      case "note_date_asc":
        const dateA = a.note_date ? new Date(a.note_date).getTime() : 0;
        const dateB = b.note_date ? new Date(b.note_date).getTime() : 0;
        return dateA - dateB;
      case "note_date_desc":
        const dateC = a.note_date ? new Date(a.note_date).getTime() : 0;
        const dateD = b.note_date ? new Date(b.note_date).getTime() : 0;
        return dateD - dateC;
      case "updated_at_asc":
        const updatedA = new Date(a.updated_at).getTime();
        const updatedB = new Date(b.updated_at).getTime();
        return updatedA - updatedB;
      case "updated_at_desc":
        const updatedC = new Date(a.updated_at).getTime();
        const updatedD = new Date(b.updated_at).getTime();
        return updatedD - updatedC;
      default:
        return 0;
    }
  });

  const handleEditMemo = (memo: any) => {
    setEditingMemo(memo);
    setOriginalFormData({
      title: memo.title || "",
      content: memo.content || "",
      note_date: memo.note_date ? new Date(memo.note_date) : new Date(),
    });
    setIsMemoDialogOpen(true);
  };

  const handleAddMemo = () => {
    setEditingMemo(null);
    setOriginalFormData({
      title: "",
      content: "",
      note_date: new Date(),
    });
    setIsMemoDialogOpen(true);
  };

  const handleResetForm = () => {
    // This function will be called when the form needs to be reset
    // The actual reset is handled inside the MemoEditDialog component
  };

  const handleSaveMemo = async (memoData: any) => {
    if (!user) return;
    
    try {
      if (editingMemo) {
        // Update existing memo
        const { error: updateError } = await supabase
          .from("notes")
          .update({
            title: memoData.title,
            content: memoData.content,
            note_date: memoData.note_date ? new Date(memoData.note_date).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMemo.id)
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Error updating note:", updateError);
          throw updateError;
        }
        
        // Update local state
        setMemos(memos.map((m) => (m.id === editingMemo.id ? { ...m, ...memoData } : m)));
      } else {
        // Add new memo
        const { data: newNote, error: insertError } = await supabase
          .from("notes")
          .insert([{
            user_id: user.id,
            title: memoData.title,
            content: memoData.content,
            note_date: memoData.note_date ? new Date(memoData.note_date).toISOString() : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select();
        
        if (insertError) {
          console.error("Error inserting note:", insertError);
          throw insertError;
        }
        
        if (newNote && newNote[0]) {
          // Add the new note to local state
          const newNoteWithDate = {
            ...newNote[0],
            note_date: newNote[0].note_date ? new Date(newNote[0].note_date) : null
          };
          
          setMemos([newNoteWithDate, ...memos]);
        }
      }
      setIsMemoDialogOpen(false);
      setEditingMemo(null);
    } catch (error: any) {
      console.error("Error saving memo:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
  };

  const handleDeleteMemo = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId || !user) return;
    
    try {
      // Delete the note
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", deleteConfirmId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      setMemos(memos.filter((m) => m.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (error: any) {
      console.error("Error deleting memo:", error);
    }
  };



  const getGridColumns = () => {
    switch (columns) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">メモ</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
              {/* Search and Filter Bar */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="メモを検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updated_at_desc">更新日時（新しい順）</SelectItem>
                        <SelectItem value="updated_at_asc">更新日時（古い順）</SelectItem>
                        <SelectItem value="note_date_desc">メモ日付（新しい順）</SelectItem>
                        <SelectItem value="note_date_asc">メモ日付（古い順）</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddMemo}>
                      <Plus className="mr-2 h-4 w-4" />
                      新規メモ
                    </Button>
                    <Button variant="outline" onClick={() => setIsLayoutSettingsOpen(true)}>
                      <Grid3X3 className="mr-2 h-4 w-4" />
                      設定
                    </Button>
                  </div>
                </div>
              </div>

              {/* Memo Grid */}
              <div className={`grid gap-4 ${getGridColumns()}`}>
                {sortedMemos.map((memo) => (
                  <MemoCard key={memo.id} memo={memo} onEdit={handleEditMemo} onDelete={handleDeleteMemo} />
                ))}
              </div>

              {sortedMemos.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">メモが見つかりません</h3>
                  <p className="text-muted-foreground mb-4">検索条件を変更するか、新しいメモを作成してください。</p>
                  <Button onClick={handleAddMemo}>
                    <Plus className="mr-2 h-4 w-4" />
                    新規メモを作成
                  </Button>
                </div>
              )}
        </main>

        {/* Dialogs */}
        <MemoEditDialog
          memo={editingMemo}
          isOpen={isMemoDialogOpen}
          onClose={() => setIsMemoDialogOpen(false)}
          onSave={handleSaveMemo}
          showExitWarning={showExitWarning}
          setShowExitWarning={setShowExitWarning}
          originalFormData={originalFormData}
          onResetForm={handleResetForm}
        />

        {/* Exit Warning Dialog */}
        <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                保存されていない変更があります。この変更を破棄しますか？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowExitWarning(false)}>
                キャンセル
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowExitWarning(false);
                // Reset form data to original state before closing
                if (originalFormData) {
                  setEditingMemo({
                    ...editingMemo,
                    title: originalFormData.title,
                    content: originalFormData.content,
                    note_date: originalFormData.note_date,
                  });
                }
                setIsMemoDialogOpen(false);
              }}>
                破棄
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <LayoutSettingsDialog
          isOpen={isLayoutSettingsOpen}
          onClose={() => setIsLayoutSettingsOpen(false)}
          columns={columns}
          onColumnsChange={setColumns}
        />

        <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>メモを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消すことができません。メモが完全に削除されます。
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
