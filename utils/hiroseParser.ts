import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
  entry_time: string;
  exit_time: string;
  profit_loss: number;
  pips: number;
  trade_memo: string;
  hold_time: number; // in seconds
}

// Helper function to convert Japanese date format to ISO string
function parseJapaneseDateTime(dateTimeStr: string): string {
  // Handle format: "DD/MM/YYYY HH:MM" or "DD/MM/YYYY HH:MM:SS 午前/午後"
  const parts = dateTimeStr.split(' ');
  
  if (parts.length < 2) {
    throw new Error(`Invalid date format: ${dateTimeStr}`);
  }

  const datePart = parts[0];
  const timePart = parts[1];
  
  // Parse date (DD/MM/YYYY)
  const [day, month, year] = datePart.split('/').map(Number);
  
  // Parse time (HH:MM or HH:MM:SS)
  let [hours, minutes, seconds = '00'] = timePart.split(':');
  
  // Handle AM/PM if present
  if (parts.length > 2) {
    const ampm = parts[2];
    const hour = parseInt(hours);
    
    if (ampm === '午後' && hour !== 12) {
      hours = (hour + 12).toString();
    } else if (ampm === '午前' && hour === 12) {
      hours = '00';
    }
  }
  
  // Create ISO string (assuming Japan timezone)
  const isoString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}.000Z`;
  
  return isoString;
}

// Helper function to convert lot size (1000 currency per lot) to standard lot size (10000 currency per lot)
function convertLotSize(lotSizeStr: string): number {
  const lotSize = parseFloat(lotSizeStr);
  // Convert from 1000 currency per lot to 10000 currency per lot
  return lotSize * 10;
}

// Helper function to convert trade type
function convertTradeType(buySellStr: string): number {
  return buySellStr === '買' ? 0 : 1; // 0 for buy, 1 for sell
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

// Main parsing function
async function parseHiroseCSV(filePath: string, userId: string): Promise<void> {
  try {
    console.log('Starting Hirose CSV parsing...');
    
    // Read CSV file
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Find the header row (skip any metadata rows)
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('決済約定日時') && lines[i].includes('通貨ペア')) {
        headerIndex = i;
        break;
      }
    }
    
    if (headerIndex === -1) {
      throw new Error('Could not find header row in CSV file');
    }
    
    const headers = lines[headerIndex].split(',').map(h => h.trim());
    console.log(`Found headers at line ${headerIndex + 1}:`, headers);
    
    // Process data rows
    const dataRows = lines.slice(headerIndex + 1).filter(line => line.trim());
    console.log(`Processing ${dataRows.length} trade records...`);
    
    let successCount = 0;
    let errorCount = 0;
    
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
        const entryTime = parseJapaneseDateTime(trade.新規約定日時);
        const exitTime = parseJapaneseDateTime(trade.決済約定日時);
        const lotSize = convertLotSize(trade.Lot数);
        const tradeType = convertTradeType(trade.売買);
        const profitLoss = parseFloat(trade.売買損益);
        const entryPrice = parseFloat(trade.新規約定値);
        const exitPrice = parseFloat(trade.決済約定値);
        const pips = (parseFloat(trade.pip損益) || 0) / 10; // Divide by 10 for Hirose
        const holdTime = calculateHoldTime(entryTime, exitTime);
        
        // Get or create symbol
        const symbolId = await getOrCreateSymbol(trade.通貨ペア);
        
        // Create trade memo with additional information
        const tradeMemo = [
          `注文番号: ${trade.注文番号}`,
          `ポジション番号: ${trade.ポジション番号}`,
          `約定区分: ${trade.約定区分}`,
          `執行条件: ${trade.執行条件}`,
          `pip損益: ${trade.pip損益}`,
          trade.手数料 ? `手数料: ${trade.手数料}` : '',
          trade.スワップ損益 ? `スワップ損益: ${trade.スワップ損益}` : '',
          trade.決済損益 ? `決済損益: ${trade.決済損益}` : '',
          trade.チャネル ? `チャネル: ${trade.チャネル}` : '',
        ].filter(Boolean).join(', ');
        
        // Prepare database record
        const dbTrade: DatabaseTrade = {
          user_id: userId,
          symbol: symbolId,
          entry_price: entryPrice,
          exit_price: exitPrice,
          lot_size: lotSize,
          trade_type: tradeType,
          entry_time: entryTime,
          exit_time: exitTime,
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
          if (successCount % 10 === 0) {
            console.log(`Processed ${successCount} trades successfully...`);
          }
        }
        
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        errorCount++;
      }
    }
    
    console.log(`\n=== Parsing Complete ===`);
    console.log(`Successfully processed: ${successCount} trades`);
    console.log(`Errors: ${errorCount} trades`);
    console.log(`Total rows processed: ${dataRows.length}`);
    
  } catch (error) {
    console.error('Error parsing Hirose CSV:', error);
    throw error;
  }
}

// Function to validate CSV file before processing
function validateHiroseCSV(filePath: string): boolean {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Check if file contains expected headers
    const hasRequiredHeaders = lines.some(line => 
      line.includes('決済約定日時') && 
      line.includes('通貨ペア') && 
      line.includes('売買') && 
      line.includes('売買損益')
    );
    
    if (!hasRequiredHeaders) {
      console.error('CSV file does not contain required Hirose headers');
      return false;
    }
    
    console.log('CSV file validation passed');
    return true;
    
  } catch (error) {
    console.error('Error validating CSV file:', error);
    return false;
  }
}

// Main execution function
export async function importHiroseTrades(csvFilePath: string, userId: string): Promise<void> {
  console.log('=== Hirose Trade Import Tool ===');
  console.log(`CSV File: ${csvFilePath}`);
  console.log(`User ID: ${userId}`);
  
  // Validate file exists
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }
  
  // Validate CSV format
  if (!validateHiroseCSV(csvFilePath)) {
    throw new Error('Invalid Hirose CSV format');
  }
  
  // Parse and import trades
  await parseHiroseCSV(csvFilePath, userId);
  
  console.log('Import completed successfully!');
}

// Example usage:
// importHiroseTrades('./path/to/hirose_export.csv', 'user-uuid-here');

export default importHiroseTrades; 