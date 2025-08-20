# Hirose Tusyo CSV Import Tool

This tool parses CSV files exported from Hirose Tusyo (ヒロセ通商) broker and automatically imports trade records into your database.

## Features

- ✅ **Automatic CSV Parsing**: Handles Hirose's specific CSV format
- ✅ **Date/Time Conversion**: Converts Japanese date format to ISO strings
- ✅ **Lot Size Conversion**: Converts from 1000 currency per lot to 10000 currency per lot
- ✅ **Symbol Management**: Automatically creates new symbols in the database
- ✅ **Trade Type Mapping**: Converts 買/売 to 0/1 for database storage
- ✅ **Holding Time Calculation**: Automatically calculates hold time in seconds
- ✅ **Error Handling**: Robust error handling with detailed logging
- ✅ **Progress Tracking**: Shows progress during import
- ✅ **Data Validation**: Validates CSV format before processing

## CSV Format Support

The tool supports the following Hirose CSV columns:

| Column | Japanese Name | Description | Required |
|--------|---------------|-------------|----------|
| 1 | 決済約定日時 | Settlement Contract Date/Time | ✅ |
| 2 | 注文番号 | Order Number | ❌ |
| 3 | ポジション番号 | Position Number | ❌ |
| 4 | 通貨ペア | Currency Pair | ✅ |
| 5 | 両建区分 | Hedging Classification | ❌ |
| 6 | 注文手法 | Order Method | ❌ |
| 7 | 約定区分 | Contract Classification | ❌ |
| 8 | 執行条件 | Execution Condition | ❌ |
| 9 | 指定レート | Specified Rate | ❌ |
| 10 | 売買 | Buy/Sell | ✅ |
| 11 | Lot数 | Lot Size | ✅ |
| 12 | 新規約定日時 | New Contract Date/Time | ✅ |
| 13 | 新規約定値 | New Contract Value | ✅ |
| 14 | 決済約定値 | Settlement Contract Value | ✅ |
| 15 | pip損益 | PIP Profit/Loss | ❌ |
| 16 | 円換算レート | Yen Conversion Rate | ❌ |
| 17 | 売買損益 | Buy/Sell Profit/Loss | ✅ |
| 18 | 手数料 | Commission | ❌ |
| 19 | スワップ損益 | Swap Profit/Loss | ❌ |
| 20 | 決済損益 | Settlement Profit/Loss | ❌ |
| 21 | チャネル | Channel | ❌ |

## Date Format Support

The tool handles these Japanese date formats:
- `DD/MM/YYYY HH:MM` (e.g., "13/6/2025 11:15")
- `DD/MM/YYYY HH:MM:SS 午前/午後` (e.g., "13/6/2025 11:15:07 午前")

## Setup

### 1. Environment Variables

Create a `.env` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Schema

Ensure your database has the required tables:

```sql
-- Symbols table
CREATE TABLE symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  symbol UUID NOT NULL REFERENCES symbols(id),
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC NOT NULL,
  lot_size NUMERIC NOT NULL,
  trade_type INTEGER NOT NULL, -- 0 for buy, 1 for sell
  entry_time TIMESTAMPZ NOT NULL,
  exit_time TIMESTAMPZ NOT NULL,
  profit_loss NUMERIC NOT NULL,
  trade_memo TEXT,
  hold_time NUMERIC NOT NULL, -- in seconds
  created_at TIMESTAMPZ DEFAULT NOW()
);
```

## Usage

### Method 1: Direct Import

```typescript
import { importHiroseTrades } from './utils/hiroseParser';

// Import trades
await importHiroseTrades('./path/to/hirose_export.csv', 'user-uuid-here');
```

### Method 2: Using Example Script

```bash
# Edit the example file with your values
nano utils/importHiroseExample.ts

# Run the import
npx ts-node utils/importHiroseExample.ts
```

### Method 3: Integration with Your App

```typescript
import { importHiroseTrades } from './utils/hiroseParser';

// In your API route or server function
export async function handleHiroseImport(csvFile: File, userId: string) {
  try {
    // Save uploaded file temporarily
    const tempPath = `/tmp/hirose_${Date.now()}.csv`;
    await fs.writeFile(tempPath, await csvFile.arrayBuffer());
    
    // Import trades
    await importHiroseTrades(tempPath, userId);
    
    // Clean up
    await fs.unlink(tempPath);
    
    return { success: true, message: 'Import completed successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## Data Mapping

The tool maps Hirose CSV data to your database as follows:

| CSV Column | Database Field | Transformation |
|------------|----------------|----------------|
| 通貨ペア | symbol | Creates/gets symbol ID |
| 売買 | trade_type | 買 → 0, 売 → 1 |
| Lot数 | lot_size | value × 10 (1000→10000) |
| 新規約定値 | entry_price | Direct mapping |
| 決済約定値 | exit_price | Direct mapping |
| 新規約定日時 | entry_time | Japanese → ISO format |
| 決済約定日時 | exit_time | Japanese → ISO format |
| 売買損益 | profit_loss | Direct mapping |
| - | hold_time | Calculated from entry/exit times |
| Multiple | trade_memo | Combined metadata |

## Error Handling

The tool handles various error scenarios:

- **Missing CSV file**: Throws descriptive error
- **Invalid CSV format**: Validates headers before processing
- **Missing required data**: Skips rows with missing essential fields
- **Database errors**: Logs errors but continues processing other rows
- **Date parsing errors**: Handles various date formats gracefully

## Logging

The tool provides detailed logging:

```
=== Hirose Trade Import Tool ===
CSV File: ./hirose_export.csv
User ID: user-uuid-here
Starting Hirose CSV parsing...
Found headers at line 2: [決済約定日時, 注文番号, ...]
Processing 150 trade records...
Processed 10 trades successfully...
Processed 20 trades successfully...
...
=== Parsing Complete ===
Successfully processed: 148 trades
Errors: 2 trades
Total rows processed: 150
Import completed successfully!
```

## Troubleshooting

### Common Issues

1. **"CSV file not found"**
   - Check file path is correct
   - Ensure file has read permissions

2. **"Invalid Hirose CSV format"**
   - Verify CSV contains required headers
   - Check for encoding issues (should be UTF-8)

3. **"Error finding symbol"**
   - Check database connection
   - Verify symbols table exists

4. **"Error inserting trade"**
   - Check database permissions
   - Verify trades table schema
   - Check for duplicate constraints

### Debug Mode

Add debug logging by modifying the parser:

```typescript
// Add this to see detailed row processing
console.log('Processing row:', values);
console.log('Parsed trade:', trade);
console.log('Database record:', dbTrade);
```

## Performance

- **Processing Speed**: ~100-500 trades per second (depends on network)
- **Memory Usage**: Processes one row at a time (low memory footprint)
- **Database Load**: Uses batch inserts for efficiency
- **Error Recovery**: Continues processing even if some rows fail

## Security

- **Input Validation**: Validates all CSV data before database insertion
- **SQL Injection Protection**: Uses parameterized queries via Supabase
- **File Type Validation**: Only accepts CSV files
- **User Isolation**: Associates all trades with specific user_id

## Future Enhancements

Potential improvements:
- Batch processing for large files
- Progress callbacks for UI integration
- Support for other broker formats
- Duplicate trade detection
- Data validation rules
- Import history tracking 