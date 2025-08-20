import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export function MemoCard({
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