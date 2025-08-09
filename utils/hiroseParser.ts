import { supabase } from '../lib/supabaseClient';
import { updateUserPerformanceMetricsBatch, TradeInput } from './metrics/updateUserPerformanceMetrics';

// Interface for parsed trade data
interface HiroseTrade {
  決済約定日時: string;        // Settlement Contract Date/Time
  注文番号: string;           // Order Number
  ポジション番号: string;      // Position Number
  通貨ペア: string;           // Currency Pair
  両建区分: string;           // Hedging Classification
  注文手法: string;           // Order Method
  約定区分: string;           // Contract Classification
  執行条件: string;           // Execution Condition
  指定レート: string;         // Specified Rate
  売買: string;              // Buy/Sell
  Lot数: string;             // Lot Size
  新規約定日時: string;        // New Contract Date/Time
  新規約定値: string;         // New Contract Value
  決済約定値: string;         // Settlement Contract Value
  pip損益: string;           // PIP Profit/Loss
  円換算レート: string;        // Yen Conversion Rate
  売買損益: string;          // Buy/Sell Profit/Loss
  手数料?: string;           // Commission (optional)
  スワップ損益?: string;      // Swap Profit/Loss (optional)
  決済損益?: string;         // Settlement Profit/Loss (optional)
  チャネル?: string;         // Channel (optional)
}

// Interface for database trade record
interface DatabaseTrade {
  user_id: string;
  symbol: string;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  trade_type: number; // 0 for buy, 1 for sell
  entry_date: string; // UTC YYYY-MM-DD
  entry_time: string; // UTC HH:MM:SS
  exit_date: string;  // UTC YYYY-MM-DD
  exit_time: string;  // UTC HH:MM:SS
  profit_loss: number;
  pips: number;
  trade_memo: string;
  hold_time: number; // in seconds
}

// Helper function to convert Japanese date format to ISO string
function parseJapaneseDateTime(dateTimeStr: string): string {
  // Handle format: "YYYY/MM/DD HH:MM:SS" (Hirose format)
  const parts = dateTimeStr.split(' ');
  
  if (parts.length < 2) {
    throw new Error(`Invalid date format: ${dateTimeStr}`);
  }

  const datePart = parts[0];
  const timePart = parts[1];
  
  // Parse date (YYYY/MM/DD) - Hirose uses YYYY/MM/DD format
  const [year, month, day] = datePart.split('/').map(Number);
  
  // Parse time (HH:MM:SS)
  let [hours, minutes, seconds = '00'] = timePart.split(':');
  
  // Handle AM/PM if present (though Hirose typically uses 24-hour format)
  if (parts.length > 2) {
    const ampm = parts[2];
    const hour = parseInt(hours);
    
    if (ampm === '午後' && hour !== 12) {
      hours = (hour + 12).toString();
    } else if (ampm === '午前' && hour === 12) {
      hours = '00';
    }
  }
  
  // Convert Japan time (JST = UTC+9) to UTC ISO
  const japanDate = new Date(Date.UTC(year, month - 1, day, parseInt(hours), parseInt(minutes), parseInt(seconds)));
  const utcDate = new Date(japanDate.getTime() - (9 * 60 * 60 * 1000));
  return utcDate.toISOString();
}

// Split ISO to UTC date/time parts
function isoToUTCDateAndTime(iso: string): { date: string; time: string } {
  // iso like 2025-06-13T00:15:37.000Z
  const d = new Date(iso);
  const yyyy = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const HH = String(d.getUTCHours()).padStart(2, '0');
  const MM = String(d.getUTCMinutes()).padStart(2, '0');
  const SS = String(d.getUTCSeconds()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}:${SS}` };
}

// Helper function to convert lot size (1000 currency per lot) to standard lot size (10000 currency per lot)
function convertLotSize(lotSizeStr: string): number {
  const lotSize = parseFloat(lotSizeStr);
  // Convert from 1000 currency per lot to 10000 currency per lot
  return lotSize / 10;
}

// Helper function to convert trade type
function convertTradeType(buySellStr: string): number {
  return buySellStr === '売' ? 0 : 1; // 売 = buy trade (0), 買 = sell trade (1)
}

// Helper function to calculate holding time in seconds
function calculateHoldTime(entryTime: string, exitTime: string): number {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  return Math.floor((exit.getTime() - entry.getTime()) / 1000);
}

// Helper function to get or create symbol ID
async function getOrCreateSymbol(symbolName: string): Promise<string> {
  // First, try to find existing symbol
  const { data: existingSymbol, error: findError } = await supabase
    .from('symbols')
    .select('id')
    .eq('symbol', symbolName)
    .single();

  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Error finding symbol: ${findError.message}`);
  }

  if (existingSymbol) {
    return existingSymbol.id;
  }

  // Create new symbol if it doesn't exist
  const { data: newSymbol, error: insertError } = await supabase
    .from('symbols')
    .insert({ symbol: symbolName })
    .select('id')
    .single();

  if (insertError) {
    throw new Error(`Error creating symbol: ${insertError.message}`);
  }

  return newSymbol.id;
}

// Main execution function for File object (for use in browser)
export async function importHiroseTradesFromFile(file: File, userId: string): Promise<{ successCount: number; errorCount: number }> {
  console.log('=== Hirose Trade Import Tool (Browser) ===');
  console.log(`CSV File: ${file.name}`);
  console.log(`User ID: ${userId}`);
  
  try {
    let text = await file.text();
    
    // Try to handle potential encoding issues
    if (text.includes('') || text.includes('')) {
      console.log('Detected encoding issues, trying to fix...');
      
      // Try reading as ArrayBuffer and decode with different encodings
      const arrayBuffer = await file.arrayBuffer();
      
      // Try Shift_JIS (common for Japanese files)
      try {
        const decoder = new TextDecoder('shift-jis');
        text = decoder.decode(arrayBuffer);
        console.log('Successfully decoded with Shift_JIS');
      } catch (e) {
        console.log('Shift_JIS failed, trying UTF-8...');
        try {
          const decoder = new TextDecoder('utf-8');
          text = decoder.decode(arrayBuffer);
          console.log('Successfully decoded with UTF-8');
        } catch (e2) {
          console.log('UTF-8 failed, using original text');
        }
      }
    }
    
    const lines = text.split('\n');
    
    console.log('CSV file content preview:');
    console.log('First 5 lines:', lines.slice(0, 5));
    console.log('Total lines:', lines.length);
    
    // Find the header row (skip any metadata rows)
    let headerIndex = -1;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      console.log(`Line ${i}: "${lines[i]}"`);
      
      // Try multiple ways to detect the header
      const line = lines[i];
      if (
        (line.includes('決済約定日時') && line.includes('通貨ペア')) ||
        (line.includes('Settlement') && line.includes('Currency')) ||
        (line.includes('USD/JPY') && line.includes('2025')) || // Look for data pattern
        (line.includes(',') && line.split(',').length >= 17) // Look for row with many columns
      ) {
        headerIndex = i;
        console.log(`Found header at line ${i}`);
        break;
      }
    }
    
    if (headerIndex === -1) {
      console.error('Could not find header row. Available lines:');
      lines.slice(0, 10).forEach((line, index) => {
        console.error(`Line ${index}: "${line}"`);
      });
      throw new Error('Could not find header row in CSV file');
    }
    
    const headers = lines[headerIndex].split(',').map(h => h.trim());
    console.log(`Found headers at line ${headerIndex + 1}:`, headers);
    
    // Skip header row and empty lines
    const dataRows = lines.slice(headerIndex + 1).filter(line => line.trim());
    
    console.log(`Processing ${dataRows.length} trade records...`);
    
    let successCount = 0;
    let errorCount = 0;
    const tradesForMetrics: TradeInput[] = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i];
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        
        // Create trade object from CSV row
        const trade: HiroseTrade = {
          決済約定日時: values[0] || '',
          注文番号: values[1] || '',
          ポジション番号: values[2] || '',
          通貨ペア: values[3] || '',
          両建区分: values[4] || '',
          注文手法: values[5] || '',
          約定区分: values[6] || '',
          執行条件: values[7] || '',
          指定レート: values[8] || '',
          売買: values[9] || '',
          Lot数: values[10] || '',
          新規約定日時: values[11] || '',
          新規約定値: values[12] || '',
          決済約定値: values[13] || '',
          pip損益: values[14] || '',
          円換算レート: values[15] || '',
          売買損益: values[16] || '',
          手数料: values[17] || '',
          スワップ損益: values[18] || '',
          決済損益: values[19] || '',
          チャネル: values[20] || '',
        };
        
        // Skip rows with empty essential data
        if (!trade.通貨ペア || !trade.売買損益 || !trade.新規約定日時 || !trade.決済約定日時) {
          console.log(`Skipping row ${i + 1}: Missing essential data`);
          continue;
        }
        
        // Parse and validate data
        const entryIso = parseJapaneseDateTime(trade.新規約定日時);
        const exitIso = parseJapaneseDateTime(trade.決済約定日時);
        const lotSize = convertLotSize(trade.Lot数);
        const tradeType = convertTradeType(trade.売買);
        const profitLoss = parseFloat(trade.売買損益);
        const entryPrice = parseFloat(trade.新規約定値);
        const exitPrice = parseFloat(trade.決済約定値);
        const pips = (parseFloat(trade.pip損益) || 0) / 10; // Divide by 10 for Hirose
        const holdTime = calculateHoldTime(entryIso, exitIso);
        
        // Get or create symbol
        const symbolId = await getOrCreateSymbol(trade.通貨ペア);
        
        // Trade memo should be empty
        const tradeMemo = "";
        
        // Convert to UTC date/time parts for DB
        const { date: entry_date, time: entry_time } = isoToUTCDateAndTime(entryIso);
        const { date: exit_date, time: exit_time } = isoToUTCDateAndTime(exitIso);
        
        // Prepare database record
        const dbTrade: DatabaseTrade = {
          user_id: userId,
          symbol: symbolId,
          entry_price: entryPrice,
          exit_price: exitPrice,
          lot_size: lotSize,
          trade_type: tradeType,
          entry_date,
          entry_time,
          exit_date,
          exit_time,
          profit_loss: profitLoss,
          pips: pips,
          trade_memo: tradeMemo,
          hold_time: holdTime,
        };
        
        // Insert into database
        const { error: insertError } = await supabase
          .from('trades')
          .insert(dbTrade);
        
        if (insertError) {
          console.error(`Error inserting trade ${i + 1}:`, insertError);
          errorCount++;
        } else {
          successCount++;
          
          // Add to metrics batch (use ISO timestamps)
          tradesForMetrics.push({
            user_id: userId,
            exit_time: exitIso,
            profit_loss: profitLoss,
            pips: pips,
            hold_time: holdTime,
            trade_type: tradeType,
            entry_time: entryIso,
          });
          
          if (successCount % 10 === 0) {
            console.log(`Processed ${successCount} trades successfully...`);
          }
        }
        
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        errorCount++;
      }
    }
    
    // Update performance metrics for all imported trades
    if (tradesForMetrics.length > 0) {
      try {
        await updateUserPerformanceMetricsBatch(tradesForMetrics);
        console.log(`Updated performance metrics for ${tradesForMetrics.length} trades`);
      } catch (metricsError) {
        console.error("Error updating performance metrics for batch import:", metricsError);
        // Don't fail the import if metrics update fails
      }
    }
    
    console.log(`\n=== Parsing Complete ===`);
    console.log(`Successfully processed: ${successCount} trades`);
    console.log(`Errors: ${errorCount} trades`);
    console.log(`Total rows processed: ${dataRows.length}`);
    
    return { successCount, errorCount };
    
  } catch (error) {
    console.error('Error parsing Hirose CSV:', error);
    throw error;
  }
}

export default importHiroseTradesFromFile; 