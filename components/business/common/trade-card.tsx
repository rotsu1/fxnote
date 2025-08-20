import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { formatHoldTime } from "@/utils/ui/timeUtils"

export function TradeCard({
    trade,
    onEdit,
    onDelete,
    displaySettings,
  }: { 
    trade: any; 
    onEdit: (trade: any) => void; 
    onDelete: (id: number) => void;
    displaySettings: Record<string, boolean>;
  }) {
    // Ensure pnl is a number
    const pnl = typeof trade.pnl === "number" ? trade.pnl : (typeof trade.profit_loss === "number" ? trade.profit_loss : 0);
    
    // Get symbol name from symbol ID
    const symbolName = trade.symbol_name || trade.pair || trade.currency_pair || "Unknown";
    
    // Get long/short text
    const getLongShortText = (type: string | number) => {
      if (type === "買い" || type === 0) return "ロング";
      if (type === "売り" || type === 1) return "ショート";
      return type;
    };

    // Use pre-loaded trade data
    const tradeTags = trade.tradeTags || [];
    const tradeEmotions = trade.tradeEmotions || [];

    const toDisplayDateTime = (d?: string, t?: string) => {
      if (!d) return "";
      if (!t) {
        // date only
        const dateOnly = new Date(`${d}T00:00:00Z`);
        return dateOnly.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }
      const date = new Date(`${d}T${t}Z`);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
  
    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant={trade.status === "利確" ? "default" : "destructive"}>{trade.status}</Badge>
                {displaySettings.show_symbol && (
                  <span className="font-medium">{symbolName}</span>
                )}
                {displaySettings.show_profit && (
                  <span className={`font-bold ${pnl > 0 ? "text-green-600" : "text-red-600"}`}>
                    {pnl > 0 ? "+" : ""}¥{Number(pnl).toLocaleString()}
                  </span>
                )}
              </div>
              {displaySettings.show_direction && (
                <div className="font-medium text-sm">{getLongShortText(trade.type || trade.trade_type)}</div>
              )}
              {displaySettings.show_entry_time && (
                <div className="font-medium text-sm">
                  エントリー: {toDisplayDateTime(trade.entry_date, trade.entry_time)}
                </div>
              )}
              {displaySettings.show_exit_time && (
                <div className="font-medium text-sm">
                  エグジット: {toDisplayDateTime(trade.exit_date, trade.exit_time)}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(trade)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(trade.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
  
          {displaySettings.show_entry_price && (
            <div className="text-sm mb-1">
              エントリー価格: {trade.entry || trade.entry_price || ""}
            </div>
          )}
  
          {displaySettings.show_exit_price && (
            <div className="text-sm mb-1">
              エグジット価格: {trade.exit || trade.exit_price || ""}
            </div>
          )}
  
          {displaySettings.show_lot && (
            <div className="text-sm mb-1">
              ロット: {trade.lot_size || ""}
            </div>
          )}
  
          {displaySettings.show_pips && (
            <div className="text-sm mb-1">
              pips: {trade.pips || ""}
            </div>
          )}
  
          {displaySettings.show_hold_time && (
            <div className="text-sm mb-1">
              保有時間: {trade.hold_time !== undefined && trade.hold_time !== null ? formatHoldTime(trade.hold_time) : ""}
            </div>
          )}
  
          {displaySettings.show_emotion && (
            <div className="flex flex-wrap gap-1 mb-1">
              <span className="text-sm">感情:</span>
              {tradeEmotions.length > 0 ? (
                tradeEmotions.map((emotion: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {emotion}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500"></span>
              )}
            </div>
          )}
  
          {displaySettings.show_tag && (
            <div className="flex flex-wrap gap-1 mb-1">
              <span className="text-sm">タグ:</span>
              {tradeTags.length > 0 ? (
                tradeTags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))
              ) : (
                <span className="text-sm text-gray-500"></span>
              )}
            </div>
          )}
  
          {displaySettings.show_note && (
            <div className="text-sm text-gray-600">
              メモ: {trade.trade_memo || ""}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }