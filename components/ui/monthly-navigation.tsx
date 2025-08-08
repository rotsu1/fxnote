import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MonthlyNavigation({ currentDate, onDateChange, trades, onImportCSV }: { currentDate: Date; onDateChange: (date: Date) => void; trades: any[]; onImportCSV: () => void }) {
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i) // 10 years before and after

  const combine = (t: any) => {
    if (t?.exit_date && t?.exit_time) return new Date(`${t.exit_date}T${t.exit_time}`);
    if (t?.entry_date && t?.entry_time) return new Date(`${t.entry_date}T${t.entry_time}`);
    if (t?.exit_time) return new Date(t.exit_time);
    if (t?.entry_time) return new Date(t.entry_time);
    if (t?.created_at) return new Date(t.created_at);
    return null;
  };

  // Calculate monthly P/L with proper timezone handling
  const monthlyPL = trades.reduce((sum: number, trade: any) => {
    const tradeDate = combine(trade);
    if (!tradeDate) return sum;
    // Use local date for comparison
    if (tradeDate.getFullYear() === currentYear && tradeDate.getMonth() === currentMonth) {
      return sum + (trade.profit_loss || trade.pnl || 0);
    }
    return sum;
  }, 0);

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(year)
    onDateChange(newDate)
  }

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(month)
    onDateChange(newDate)
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => handleMonthChange(currentMonth - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Select value={String(currentYear)} onValueChange={(val) => handleYearChange(Number(val))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>{year}年</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(currentMonth)} onValueChange={(val) => handleMonthChange(Number(val))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, idx) => (
                <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => handleMonthChange(currentMonth + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onImportCSV}>
          <Upload className="mr-2 h-4 w-4" />
          CSV
        </Button>
        <div
          className={`text-lg font-semibold ${
            monthlyPL > 0
              ? "text-green-600"
              : monthlyPL < 0
              ? "text-red-600"
              : "text-gray-500"
          }`}
        >
          月間損益: {monthlyPL > 0 ? "+" : ""}¥{monthlyPL.toLocaleString()}
        </div>
      </div>
    </div>
  )
}