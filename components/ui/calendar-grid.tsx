import { getPLColor } from "@/utils/performanceUtils"

export function CalendarGrid({ currentDate, onDateClick, groupedTrades }: { currentDate: Date; onDateClick: (date: string) => void; groupedTrades: Record<string, any[]> }) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
  
    const days = [];
    const current = new Date(startDate);
  
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  
    // Calculate daily P/L
    const getDailyPL = (date: string, groupedTrades: Record<string, any[]>): number => {
      const trades = groupedTrades[date] || [];
      return trades.reduce((sum: number, trade: any) => sum + (trade.profit_loss || 0), 0);
    };
  
    return (
      <div className="bg-white rounded-lg border">
        {/* Header */}
        <div className="grid grid-cols-7 border-b">
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={`p-3 text-center font-medium ${index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-700"}`}
            >
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const isCurrentMonth = day.getMonth() === month;
            const dailyPL = getDailyPL(dateStr, groupedTrades);
            const tradeCount = (groupedTrades[dateStr] || []).length;
            const colorClass = isCurrentMonth && tradeCount > 0 ? getPLColor(dailyPL) : "";
  
            // Debug logging
            if (isCurrentMonth && tradeCount > 0) {
              console.log(`Date: ${dateStr}, P/L: ${dailyPL}, Color: ${colorClass}`);
            }
  
            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border-r border-b cursor-pointer transition-colors ${
                  !isCurrentMonth 
                    ? "text-gray-400 bg-gray-50" 
                    : colorClass 
                      ? colorClass 
                      : "hover:bg-gray-50"
                }`}
                style={colorClass ? { backgroundColor: colorClass.includes('green') ? '#10b981' : colorClass.includes('red') ? '#ef4444' : '#6b7280' } : {}}
                onClick={() => isCurrentMonth && onDateClick(dateStr)}
              >
                <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                {isCurrentMonth && tradeCount > 0 && (
                  <div className="text-xs space-y-1">
                    <div className={`font-medium ${dailyPL > 0 ? "text-green-800" : "text-red-800"}`}>
                      {dailyPL > 0 ? "+" : ""}¥{dailyPL.toLocaleString()}
                    </div>
                    <div className="text-gray-600">{tradeCount}件</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }