import { Trade } from "./types";

// Field mapping from frontend to database
const FIELD_MAPPING: Record<keyof Trade, string> = {
  id: 'id',
  date: 'entry_time',
  time: 'entry_time',
  entryTime: 'entry_time',
  exitTime: 'exit_time',
  pair: 'symbol',
  type: 'trade_type',
  lot: 'lot_size',
  entry: 'entry_price',
  exit: 'exit_price',
  pips: 'pips',
  profit: 'profit_loss',
  emotion: 'emotion',
  holdingTime: 'hold_time',
  holdingDays: 'hold_time',
  holdingHours: 'hold_time',
  holdingMinutes: 'hold_time',
  holdingSeconds: 'hold_time',
  notes: 'trade_memo',
  tags: 'tags'
};

// Fields that should not be directly edited in the table
const NON_EDITABLE_FIELDS: (keyof Trade)[] = ['tags', 'date', 'time', 'id'];

/**
 * Check if a field is editable in the table
 */
export function isFieldEditable(field: keyof Trade): boolean {
  return !NON_EDITABLE_FIELDS.includes(field);
}

/**
 * Validate cell value based on field type
 */
export function validateCellValue(field: keyof Trade, value: any): { isValid: boolean; error?: string } {
  // Basic validation rules
  if (field === 'lot' || field === 'entry' || field === 'exit' || field === 'pips' || field === 'profit') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { isValid: false, error: '数値を入力してください' };
    }
    if (field === 'lot' && numValue <= 0) {
      return { isValid: false, error: 'ロットは0より大きい値を入力してください' };
    }
    if ((field === 'entry' || field === 'exit') && numValue <= 0) {
      return { isValid: false, error: '価格は0より大きい値を入力してください' };
    }
  }
  
  if (field === 'pair' && !value?.trim()) {
    return { isValid: false, error: 'シンボルを入力してください' };
  }
  
  if (field === 'type' && !['買い', '売り'].includes(value)) {
    return { isValid: false, error: '有効な取引種別を選択してください' };
  }
  
  return { isValid: true };
}

/**
 * Map frontend field names to database column names
 */
export function mapFieldToDatabase(field: keyof Trade, value: any) {
  const dbField = FIELD_MAPPING[field];
  
  // Transform values for database
  if (field === 'type') {
    return { field: dbField, value: value === '買い' ? 0 : 1 };
  }
  
  if (field === 'entryTime' || field === 'exitTime') {
    // For datetime fields, value should already be in ISO format
    return { field: dbField, value };
  }
  
  if (field === 'date' || field === 'time') {
    // Handle date/time updates - this is complex and might need special handling
    return { field: dbField, value, needsSpecialHandling: true };
  }
  
  return { field: dbField, value };
}

/**
 * Get formatted column value for display
 */
export function getColumnValue(trade: Trade, columnId: string, allColumns: any[]) {
  const column = allColumns.find((c) => c.id === columnId);
  if (!column) return "";

  const value = trade[column.id as keyof Trade];

  if (column.id === "profit" && typeof value === "number") {
    return `¥${value.toLocaleString()}`;
  }
  if (column.id === "pips" && typeof value === "number") {
    return `${value} pips`;
  }
  if (column.id === "holdingTime" && typeof value === "number") {
    const totalSeconds = value;
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    
    let result = "";
    if (days > 0) result += `${days}日`;
    if (hours > 0) result += `${hours}時間`;
    if (minutes > 0) result += `${minutes}分`;
    if (seconds > 0) result += `${seconds}秒`;
    
    return result || "0秒";
  }
  if (column.id === "tags" && Array.isArray(value)) {
    return value; // Return array for JSX rendering in component
  }
  if (column.id === "emotion" && Array.isArray(value)) {
    return value; // Return array for JSX rendering in component
  }
  return String(value);
}

/**
 * Transform database trade data to frontend Trade interface
 */
export function transformTradeData(trade: any, tagsByTradeId: Record<number, string[]>, emotionsByTradeId: Record<number, string[]>): Trade {
  const entryTime = new Date(trade.entry_time);
  const exitTime = new Date(trade.exit_time);
  
  // Convert UTC to local timezone
  const convertToLocalTime = (date: Date) => {
    // The Date object automatically handles timezone conversion when created from UTC
    return date;
  };
  
  const localEntryTime = convertToLocalTime(entryTime);
  const localExitTime = convertToLocalTime(exitTime);

  return {
    id: trade.id,
    date: localEntryTime.toLocaleDateString('en-CA'), // YYYY-MM-DD format in local timezone
    time: formatLocalTime(localEntryTime),
    entryTime: formatDateTime(localEntryTime),
    exitTime: formatDateTime(localExitTime),
    pair: trade.symbols?.symbol || "",
    type: (trade.trade_type === 0 ? "買い" : "売り") as "買い" | "売り",
    lot: trade.lot_size || 0,
    entry: trade.entry_price,
    exit: trade.exit_price,
    pips: trade.pips || 0,
    profit: trade.profit_loss,
    emotion: emotionsByTradeId[trade.id] || [],
    holdingTime: trade.hold_time || 0,
    notes: trade.trade_memo || "",
    tags: tagsByTradeId[trade.id] || [],
  };
}

// Import time formatting functions
import { formatLocalTime, formatDateTime } from "./timeUtils"; 