import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MonthlyNavigation({ currentDate, onDateChange, trades, onImportCSV }: { currentDate: Date; onDateChange: (date: Date) => void; trades: any[]; onImportCSV: () => void }) {
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i) // 10 years before and after

  const combine = (t: any) => {
    if (t?.exit_date && t?.exit_time) return new Date(`${t.exit_date}T${t.exit_time}Z`);
    if (t?.entry_date && t?.entry_time) return new Date(`${t.entry_date}T${t.entry_time}Z`);
    if (t?.exit_time) return new Date(t.exit_time);
    if (t?.entry_time) return new Date(t.entry_time);
    if (t?.created_at) return new Date(t.created_at);
    return null;
  };

  // Calculate monthly P/L with proper timezone handling
  const monthlyPL = trades.reduce((sum: number, trade: any) => {
    // For monthly P/L, prioritize closed trades (exit_date/exit_time) over open trades
    let tradeDate: Date | null = null;
    
    // First, try to use exit_date and exit_time (when trade was closed)
    if (trade?.exit_date && trade?.exit_time) {
      try {
        // Create date from exit_date and exit_time, then convert to local time
        const utcDate = new Date(`${trade.exit_date}T${trade.exit_time}Z`);
        tradeDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
      } catch (error) {
        console.warn('Error parsing exit date/time for trade:', trade.id, trade.exit_date, trade.exit_time);
      }
    }
    
    // If only exit_date is present (without exit_time), use that for monthly P/L
    if (!tradeDate && trade?.exit_date) {
      try {
        tradeDate = new Date(trade.exit_date);
      } catch (error) {
        console.warn('Error parsing exit date for trade:', trade.id, trade.exit_date);
      }
    }
    
    // If no exit date/time, fall back to entry date/time (when trade was opened)
    if (!tradeDate && trade?.entry_date && trade?.entry_time) {
      try {
        // Create date from entry_date and entry_time, then convert to local time
        const utcDate = new Date(`${trade.entry_date}T${trade.entry_time}Z`);
        tradeDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
      } catch (error) {
        console.warn('Error parsing entry date/time for trade:', trade.id, trade.entry_date, trade.entry_time);
      }
    }
    
    // If only entry_date is present (without entry_time), use that
    if (!tradeDate && trade?.entry_date) {
      try {
        tradeDate = new Date(trade.entry_date);
      } catch (error) {
        console.warn('Error parsing entry date for trade:', trade.id, trade.entry_date);
      }
    }
    
    // If still no valid date, try the old combine function as fallback
    if (!tradeDate) {
      tradeDate = combine(trade);
    }
    
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