import { Trade } from "./types";

// Field mapping from frontend to database
const FIELD_MAPPING: Record<keyof Trade, string> = {
  id: 'id',
  date: 'entry_date',
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
    // Handled specially in save; keep mapping for reference
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

  // Display datetime-local values with a space for readability
  if ((column.id === "entryTime" || column.id === "exitTime") && typeof value === "string") {
    return value.replace('T', ' ');
  }

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
  // Build Date objects from separate date and time stored in DB (treating as UTC)
  const toLocalDateFromParts = (dateStr?: string, timeStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    // Use 00:00:00 if time missing for date-only purposes
    const time = timeStr && timeStr.trim() !== '' ? timeStr : '00:00:00';
    return new Date(`${dateStr}T${time}Z`);
  };

  const localEntry = toLocalDateFromParts(trade.entry_date, trade.entry_time);
  const localExit = toLocalDateFromParts(trade.exit_date, trade.exit_time);

  // Format to datetime-local string for inputs (YYYY-MM-DDTHH:MM:SS)
  const toLocalInputString = (d?: Date, hadTime?: boolean): string => {
    if (!d || !hadTime) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Determine display date: prefer exit_date; fall back to entry_date
  const displayDate = (() => {
    if (trade.exit_date) {
      const d = toLocalDateFromParts(trade.exit_date, trade.exit_time);
      return d ? d.toLocaleDateString('en-CA') : '';
    }
    if (trade.entry_date) {
      const d = toLocalDateFromParts(trade.entry_date, trade.entry_time);
      return d ? d.toLocaleDateString('en-CA') : '';
    }
    return '';
  })();

  return {
    id: trade.id,
    date: displayDate,
    time: localEntry ? formatLocalTime(localEntry) : "",
    entryTime: toLocalInputString(localEntry, !!trade.entry_time),
    exitTime: toLocalInputString(localExit, !!trade.exit_time),
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
import { formatLocalTime } from "./timeUtils"; 

export const COLUMN_MAPPINGS: Record<string, string> = {
  id: 'id',
  date: 'entry_date',
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
  emotion: 'emotions',
  notes: 'trade_memo',
};

export const toLocalDateString = (trade: any): string => {
  if (trade.exit_date && trade.exit_time) {
    const d = new Date(`${trade.exit_date}T${trade.exit_time}Z`);
    return d.toLocaleDateString('en-CA');
  }
  if (trade.entry_date && trade.entry_time) {
    const d = new Date(`${trade.entry_date}T${trade.entry_time}Z`);
    return d.toLocaleDateString('en-CA');
  }
  return '';
};

export const toComparableDate = (trade: any): number => {
  if (trade.exit_date && trade.exit_time) return new Date(`${trade.exit_date}T${trade.exit_time}Z`).getTime();
  if (trade.entry_date && trade.entry_time) return new Date(`${trade.entry_date}T${trade.entry_time}Z`).getTime();
  return 0;
};

export const formatDateTimeForCell = (dateStr?: string, timeStr?: string): string => {
  if (!dateStr || !timeStr) return '';
  const d = new Date(`${dateStr}T${timeStr}`);
  return d.toLocaleString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}; 