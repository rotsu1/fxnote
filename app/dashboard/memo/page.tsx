"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Plus,
  Search,
  Filter,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/business/common/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { MemoCard } from "@/components/business/memo/memo-card";
import { MemoEditDialog } from "@/components/business/memo/memo-edit-dialog";
import { FreemiumCard } from "@/components/business/common/freemium-dialog";
import { useRouter } from "next/navigation";

export default function Memo() {
  const user = useAuth();
  const router = useRouter();
  const [memos, setMemos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated_at_desc");
  const [editingMemo, setEditingMemo] = useState<any>(null);
  const [isMemoDialogOpen, setIsMemoDialogOpen] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<any>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [access, setAccess] = useState<'none' | 'limited' | 'full' | null>(null);

  useEffect(() => {
    // Read cached access and refresh in background
    try {
      const a = sessionStorage.getItem('fxnote.access') as 'none' | 'limited' | 'full' | null
      if (a) setAccess(a)
    } catch {}
    ;(async () => {
      try {
        const { data: s } = await supabase.auth.getSession()
        const token = s.session?.access_token
        if (!token) return
        const res = await fetch('/api/me/subscription-status', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        const json = await res.json() as { access: 'none' | 'limited' | 'full'; reason: string }
        try {
          sessionStorage.setItem('fxnote.access', json.access)
          sessionStorage.setItem('fxnote.subReason', json.reason)
        } catch {}
        setAccess(json.access)
      } catch {}
    })()
  }, [])

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
    // Reset all form-related state when adding a new memo
    setEditingMemo(null);
    setOriginalFormData({
      title: "",
      content: "",
      note_date: new Date(),
    });
    setShowExitWarning(false);
    setIsMemoDialogOpen(true);
  };

  const handleResetForm = () => {
    // Reset form state when needed
    if (editingMemo) {
      // Reset to original memo data
      setEditingMemo({
        ...editingMemo,
        title: originalFormData?.title || "",
        content: originalFormData?.content || "",
        note_date: originalFormData?.note_date || new Date(),
      });
    } else {
      // Reset to empty form for new memo
      setEditingMemo(null);
    }
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
      setOriginalFormData(null);
      setShowExitWarning(false);
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

  return (
    <>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">メモ</h1>
          </div>
        </header>

        <main className="main-content px-4 md:px-6 pt-6">
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
                  </div>
                </div>
              </div>

              {/* Memo Grid */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
          key={editingMemo ? `edit-${editingMemo.id}` : 'create-new'}
          memo={editingMemo}
          isOpen={isMemoDialogOpen}
          onClose={() => {
            setIsMemoDialogOpen(false);
            setEditingMemo(null);
            setOriginalFormData(null);
            setShowExitWarning(false);
          }}
          onSave={handleSaveMemo}
          showExitWarning={showExitWarning}
          setShowExitWarning={setShowExitWarning}
          originalFormData={originalFormData}
          onResetForm={handleResetForm}
        />

        {/* Exit Warning Dialog */}
        <ConfirmDialog
          open={showExitWarning}
          onOpenChange={setShowExitWarning}
          title="変更を破棄しますか？"
          description="保存されていない変更があります。この変改を破棄しますか？"
          onConfirm={() => setShowExitWarning(false)}
          onCancel={() => setShowExitWarning(false)}
        />

        <ConfirmDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
          title="メモを削除しますか？"
          description="この操作は取り消すことができません。メモが完全に削除されます。"
          onConfirm={confirmDelete}
        />
      </SidebarInset>
    </SidebarProvider>
    {access !== 'full' && (
      <div className="pointer-events-auto fixed inset-0 md:left-[16rem] bg-black/50 z-50 flex items-center justify-center">
        <FreemiumCard onClose={() => router.replace('/dashboard/overview')} featureLabel="メモ" />
      </div>
    )}
    </>
  );
}
