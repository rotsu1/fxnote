import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Plus, Filter } from "lucide-react"
import { TradeCard } from "@/components/business/common/trade-card"

export function RightSidebar({
  isOpen,
  onClose,
  selectedDate,
  trades,
  onEditTrade,
  onDeleteTrade,
  onAddTrade,
  onDisplaySettings,
  displaySettings,
}: {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  trades: any[]
  onEditTrade: (trade: any) => void
  onDeleteTrade: (id: number) => void
  onAddTrade: () => void
  onDisplaySettings: () => void
  displaySettings: Record<string, boolean>
}) {
  if (!isOpen) return null

  const dailyPL = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0)

  const combine = (t: any) => {
    if (t?.exit_date && t?.exit_time) return new Date(`${t.exit_date}T${t.exit_time}Z`);
    if (t?.entry_date && t?.entry_time) return new Date(`${t.entry_date}T${t.entry_time}Z`);
    if (t?.exit_time) return new Date(t.exit_time);
    if (t?.entry_time) return new Date(t.entry_time);
    if (t?.created_at) return new Date(t.created_at);
    return new Date(0);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{selectedDate}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div
            className={`text-xl font-bold ${
              dailyPL > 0
                ? "text-green-600"
                : dailyPL < 0
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            日次損益: {dailyPL > 0 ? "+" : ""}¥{dailyPL.toLocaleString()}
          </div>


          <div className="text-sm text-gray-500">{trades.length}件の取引</div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b space-y-2">
          <Button onClick={onAddTrade} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            取引追加
          </Button>
          <Button variant="outline" onClick={onDisplaySettings} className="w-full bg-transparent">
            <Filter className="mr-2 h-4 w-4" />
            表示設定
          </Button>
        </div>

        {/* Trade History */}
        <div className="p-4">
          <h4 className="font-medium mb-3">取引履歴</h4>
          {trades
            .sort((a, b) => combine(a).getTime() - combine(b).getTime())
            .map((trade) => (
              <TradeCard key={trade.id} trade={trade} onEdit={onEditTrade} onDelete={onDeleteTrade} displaySettings={displaySettings} />
            ))}
        </div>
      </div>
    </>
  )
}