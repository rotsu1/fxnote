// Helper to convert local datetime string to UTC ISO string
export function localDateTimeToUTC(localDateTimeString: string): string {
    if (!localDateTimeString || localDateTimeString.trim() === "") {
      console.log("localDateTimeToUTC: Empty input, using current time");
      return new Date().toISOString();
    }
    
    console.log("localDateTimeToUTC: Input:", localDateTimeString);
    
    // Create a date object from the local datetime string
    const date = new Date(localDateTimeString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error("localDateTimeToUTC: Invalid date string:", localDateTimeString);
      return new Date().toISOString();
    }
    
    const result = date.toISOString();
    console.log("localDateTimeToUTC: Output:", result);
    return result;
}

// Helper to convert UTC ISO string to local datetime string for input
export function utcToLocalDateTime(input: string): string {
    if (!input) return "";
    const date = new Date(input);
    if (isNaN(date.getTime())) return "";
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Helper to format hold time from seconds to readable format
export function formatHoldTime(seconds: number): string {
    if (!seconds || seconds <= 0) return "0分";
    
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    let result = "";
    if (days > 0) result += `${days}日`;
    if (hours > 0) result += `${hours}時間`;
    if (minutes > 0) result += `${minutes}分`;
    if (remainingSeconds > 0) result += `${remainingSeconds}秒`;
    
    return result || "0分";
}

// Helper to format hold time from seconds to compact format (for table display)
export function formatHoldTimeCompact(seconds: number): string {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
}

// Helper to format local time (HH:MM)
export function formatLocalTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Helper to format datetime with seconds (YYYY-MM-DD HH:MM:SS)
export function formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Helper to parse time string and convert to minutes for sorting
export function parseTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    let totalMinutes = 0;
    
    // Parse hours
    const hourMatch = timeStr.match(/(\d+)h/);
    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }
    
    // Parse minutes
    const minuteMatch = timeStr.match(/(\d+)m/);
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }
    
    // Parse seconds
    const secondMatch = timeStr.match(/(\d+)s/);
    if (secondMatch) {
      totalMinutes += parseInt(secondMatch[1]) / 60;
    }
    
    return totalMinutes;
}

// Helper to group trades by date (exit_date/exit_time) with proper timezone handling
export function groupTradesByDate(trades: any[]): Record<string, any[]> {
    return trades.reduce((acc: Record<string, any[]>, trade: any) => {
      // Prefer exit date; fall back to entry date; allow missing time
      const dateStr = trade.exit_date || trade.entry_date;
      if (!dateStr) return acc;
      const timeStr = trade.exit_date ? (trade.exit_time || '00:00:00') : (trade.entry_time || '00:00:00');
      
      const d = new Date(`${dateStr}T${timeStr}Z`);
      const localDate = d.toLocaleDateString('en-CA');
      
      if (!acc[localDate]) acc[localDate] = [];
      acc[localDate].push(trade);
      return acc;
    }, {});
  }