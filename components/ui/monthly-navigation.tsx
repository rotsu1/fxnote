import { addMonths, format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"

export function MonthlyNavigation({ currentDate, onDateChange, trades, onImportCSV }: { currentDate: Date; onDateChange: (d: Date) => void; trades: any[]; onImportCSV: () => void }) {
  const handlePrevMonth = () => onDateChange(addMonths(currentDate, -1))
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1))

  const combine = (t: any) => {
    if (t?.exit_date && t?.exit_time) return new Date(`${t.exit_date}T${t.exit_time}`);
    if (t?.entry_date && t?.entry_time) return new Date(`${t.entry_date}T${t.entry_time}`);
    if (t?.exit_time) return new Date(t.exit_time);
    if (t?.entry_time) return new Date(t.entry_time);
    if (t?.created_at) return new Date(t.created_at);
    return null;
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthlyPL = trades.reduce((sum: number, trade: any) => {
    const tradeDateObj = combine(trade);
    if (!tradeDateObj) return sum;
    if (tradeDateObj.getFullYear() === currentYear && tradeDateObj.getMonth() === currentMonth) {
      return sum + (trade.profit_loss || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handlePrevMonth}>{"<"}</Button>
        <div className="text-lg font-semibold">{format(currentDate, 'yyyy年MM月', { locale: ja })}</div>
        <Button variant="outline" onClick={handleNextMonth}>{">"}</Button>
      </div>
      <div className={`text-sm font-medium ${monthlyPL > 0 ? 'text-green-600' : monthlyPL < 0 ? 'text-red-600' : 'text-gray-500'}`}>
        月間損益: {monthlyPL > 0 ? '+' : ''}¥{monthlyPL.toLocaleString()}
      </div>
      <Button variant="outline" onClick={onImportCSV}>CSVインポート</Button>
    </div>
  )
}