"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Plus,
  Search,
  Tag,
  Edit,
  Trash2,
  Download,
  Grid3X3,
  MoreHorizontal,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  AppSidebar,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

// Remove sampleMemos

const availableTags = [
  "USD/JPY",
  "EUR/USD",
  "GBP/JPY",
  "トレンド分析",
  "市場観察",
  "取引日記",
  "振り返り",
  "週間展望",
  "経済指標",
  "リスク管理",
  "戦略",
  "バックテスト",
  "移動平均線",
  "心理",
  "取引ルール",
  "テクニカル分析",
  "フィボナッチ",
  "学習",
]

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

  const getTypeColor = (type: string) => {
    const colors = {
      "market-analysis": "bg-blue-100 text-blue-800",
      "trade-journal": "bg-green-100 text-green-800",
      "market-outlook": "bg-purple-100 text-purple-800",
      strategy: "bg-orange-100 text-orange-800",
      psychology: "bg-red-100 text-red-800",
      learning: "bg-yellow-100 text-yellow-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
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
        <div className="text-xs text-muted-foreground">{memo.date}</div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-4">{truncateContent(memo.content)}</p>
        <div className="flex flex-wrap gap-1">
          {memo.tags.slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {memo.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{memo.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MemoEditDialog({
  memo,
  isOpen,
  onClose,
  onSave,
}: {
  memo: any
  isOpen: boolean
  onClose: () => void
  onSave: (memo: any) => void
}) {
  const [formData, setFormData] = useState(
    memo || {
      title: "",
      content: "",
      tags: [],
      type: "trade-journal",
    },
  )
  const [newTag, setNewTag] = useState("")

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((tag: string) => tag !== tagToRemove) })
  }

  const addExistingTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <Label htmlFor="type">種類</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trade-journal">取引日記</SelectItem>
                <SelectItem value="market-analysis">市場分析</SelectItem>
                <SelectItem value="market-outlook">市場展望</SelectItem>
                <SelectItem value="strategy">戦略</SelectItem>
                <SelectItem value="psychology">心理</SelectItem>
                <SelectItem value="learning">学習</SelectItem>
              </SelectContent>
            </Select>
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

          <div>
            <Label>タグ</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="新しいタグ"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTag()}
              />
              <Button type="button" onClick={addTag}>
                <Tag className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-3">
              <div className="text-sm text-muted-foreground mb-2">既存のタグから選択:</div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {availableTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant={formData.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => addExistingTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="default" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
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

function ExportDialog({
  isOpen,
  onClose,
  selectedMemos,
}: {
  isOpen: boolean
  onClose: () => void
  selectedMemos: any[]
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>メモエクスポート</DialogTitle>
          <DialogDescription>{selectedMemos.length}件のメモをエクスポートします</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>エクスポート形式</Label>
            <Select defaultValue="text">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">テキストファイル (.txt)</SelectItem>
                <SelectItem value="pdf">PDFファイル (.pdf)</SelectItem>
                <SelectItem value="markdown">Markdownファイル (.md)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>含める情報</Label>
            <div className="space-y-2 mt-2">
              {[
                { id: "title", label: "タイトル", checked: true },
                { id: "date", label: "日付", checked: true },
                { id: "content", label: "内容", checked: true },
                { id: "tags", label: "タグ", checked: true },
              ].map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox id={item.id} defaultChecked={item.checked} />
                  <Label htmlFor={item.id}>{item.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button>エクスポート</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function MemoPage() {
  const user = useAuth();
  const [memos, setMemos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMemos, setSelectedMemos] = useState<number[]>([]);
  const [columns, setColumns] = useState(3);
  const [editingMemo, setEditingMemo] = useState<any>(null);
  const [isMemoDialogOpen, setIsMemoDialogOpen] = useState(false);
  const [isLayoutSettingsOpen, setIsLayoutSettingsOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    supabase
      .from("memos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setMemos([]);
        } else {
          setMemos(data || []);
        }
        setLoading(false);
      });
  }, [user]);

  // Filter memos based on search and tags
  const filteredMemos = memos.filter((memo) => {
    const matchesSearch =
      memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => memo.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const handleEditMemo = (memo: any) => {
    setEditingMemo(memo);
    setIsMemoDialogOpen(true);
  };

  const handleAddMemo = () => {
    setEditingMemo(null);
    setIsMemoDialogOpen(true);
  };

  const handleSaveMemo = async (memoData: any) => {
    if (!user) return;
    
    try {
      if (editingMemo) {
        // Update existing memo
        const { error } = await supabase
          .from("memos")
          .update({
            title: memoData.title,
            content: memoData.content,
            tags: memoData.tags,
            type: memoData.type,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMemo.id)
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        setMemos(memos.map((m) => (m.id === editingMemo.id ? { ...m, ...memoData } : m)));
      } else {
        // Add new memo
        const { data, error } = await supabase
          .from("memos")
          .insert([{
            user_id: user.id,
            title: memoData.title,
            content: memoData.content,
            tags: memoData.tags,
            type: memoData.type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
          setMemos([data[0], ...memos]);
        }
      }
      setIsMemoDialogOpen(false);
      setEditingMemo(null);
    } catch (error: any) {
      console.error("Error saving memo:", error);
      setError(error.message);
    }
  };

  const handleDeleteMemo = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId || !user) return;
    
    try {
      const { error } = await supabase
        .from("memos")
        .delete()
        .eq("id", deleteConfirmId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      setMemos(memos.filter((m) => m.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (error: any) {
      console.error("Error deleting memo:", error);
      setError(error.message);
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
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
          {loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-10">{error}</div>
          ) : (
            <>
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
                    <Button onClick={handleAddMemo}>
                      <Plus className="mr-2 h-4 w-4" />
                      新規メモ
                    </Button>
                    <Button variant="outline" onClick={() => setIsLayoutSettingsOpen(true)}>
                      <Grid3X3 className="mr-2 h-4 w-4" />
                      設定
                    </Button>
                    <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                      <Download className="mr-2 h-4 w-4" />
                      エクスポート
                    </Button>
                  </div>
                </div>

                {/* Tag Filter */}
                <div>
                  <div className="text-sm font-medium mb-2">タグでフィルター:</div>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTagFilter(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {selectedTags.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])} className="h-6 px-2 text-xs">
                        クリア
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results Info */}
              <div className="mb-4 text-sm text-muted-foreground">{filteredMemos.length}件のメモが見つかりました</div>

              {/* Memo Grid */}
              <div className={`grid gap-4 ${getGridColumns()}`}>
                {filteredMemos.map((memo) => (
                  <MemoCard key={memo.id} memo={memo} onEdit={handleEditMemo} onDelete={handleDeleteMemo} />
                ))}
              </div>

              {filteredMemos.length === 0 && (
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
            </>
          )}
        </main>

        {/* Dialogs */}
        <MemoEditDialog
          memo={editingMemo}
          isOpen={isMemoDialogOpen}
          onClose={() => setIsMemoDialogOpen(false)}
          onSave={handleSaveMemo}
        />

        <LayoutSettingsDialog
          isOpen={isLayoutSettingsOpen}
          onClose={() => setIsLayoutSettingsOpen(false)}
          columns={columns}
          onColumnsChange={setColumns}
        />

        <ExportDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          selectedMemos={filteredMemos}
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
