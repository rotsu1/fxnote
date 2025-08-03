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

// Helper to group trades by date (exit_time) with proper timezone handling
export function groupTradesByDate(trades: any[]): Record<string, any[]> {
    return trades.reduce((acc: Record<string, any[]>, trade: any) => {
      if (!trade.exit_time) return acc;
      
      // Convert UTC timestamp to local date
      const exitDate = new Date(trade.exit_time);
      const localDate = exitDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
      
      if (!acc[localDate]) acc[localDate] = [];
      acc[localDate].push(trade);
      return acc;
    }, {});
  }