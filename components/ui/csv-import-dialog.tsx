import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { localDateTimeToUTC } from "@/utils/timeUtils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CSVImportDialog({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: any }) {
    const [isCustomBrokerOpen, setIsCustomBrokerOpen] = useState(false);
    const [customBrokerName, setCustomBrokerName] = useState("");
    const [customBrokerEmail, setCustomBrokerEmail] = useState("");
    const [customBrokerCSV, setCustomBrokerCSV] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedBroker, setSelectedBroker] = useState<string>("");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState<string>("");
    const [importError, setImportError] = useState<string>("");
    const [importSuccess, setImportSuccess] = useState<string>("");
  
    // Reset dialog state when it opens
    useEffect(() => {
      if (isOpen) {
        setImportProgress("");
        setImportError("");
        setImportSuccess("");
        setCsvFile(null);
        setSelectedBroker("");
      }
    }, [isOpen]);
  
    const handleCustomBrokerSubmit = async () => {
      if (!customBrokerName.trim() || !customBrokerEmail.trim() || !customBrokerCSV) {
        return;
      }
  
      setIsSubmitting(true);
      
      try {
        // Here you would typically send this data to your backend
        // For now, we'll just simulate a submission
        console.log("Custom broker request:", {
          brokerName: customBrokerName,
          email: customBrokerEmail,
          csvFile: customBrokerCSV.name
        });
  
        // Reset form
        setCustomBrokerName("");
        setCustomBrokerEmail("");
        setCustomBrokerCSV(null);
        setIsCustomBrokerOpen(false);
        
        // Show success message (you can implement a toast notification here)
        alert("リクエストが送信されました。開発チームが確認次第、対応いたします。");
      } catch (error) {
        console.error("Error submitting custom broker request:", error);
        alert("エラーが発生しました。もう一度お試しください。");
      } finally {
        setIsSubmitting(false);
      }
    };
  
    const handleCSVFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === "text/csv") {
        setCustomBrokerCSV(file);
      }
    };
  
    const handleMainCSVFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === "text/csv") {
        setCsvFile(file);
        setImportError("");
        setImportSuccess("");
      }
    };
  
    // Validate Hirose CSV format
    const validateHiroseCSV = async (file: File): Promise<boolean> => {
      try {
        // Try to read with proper encoding
        let text = await file.text();
        
        // Check if we have encoding issues (replacement characters)
        if (text.includes('')) {
          console.log('Detected encoding issues, trying to fix...');
          
          // Try reading as ArrayBuffer and decode with different encodings
          const arrayBuffer = await file.arrayBuffer();
          
          // Try Shift_JIS (common for Japanese files)
          try {
            const decoder = new TextDecoder('shift-jis');
            text = decoder.decode(arrayBuffer);
            console.log('Successfully decoded with Shift_JIS');
          } catch (shiftJisError) {
            console.log('Shift_JIS failed, trying other encodings...');
            
            // Try other common Japanese encodings
            const encodings = ['cp932', 'euc-jp', 'iso-2022-jp'];
            for (const encoding of encodings) {
              try {
                const decoder = new TextDecoder(encoding);
                text = decoder.decode(arrayBuffer);
                console.log(`Successfully decoded with ${encoding}`);
                break;
              } catch (e) {
                console.log(`${encoding} failed`);
              }
            }
          }
        }
        
        const lines = text.split('\n');
        
        console.log('CSV Content Preview:', text.substring(0, 500));
        console.log('First 5 lines:', lines.slice(0, 5));
        console.log('File encoding check - first line bytes:', Array.from(text.substring(0, 100)).map(c => c.charCodeAt(0)));
        
        // Check if file contains expected Hirose headers
        let foundHeaders = {
          決済約定日時: false,
          通貨ペア: false,
          売買: false,
          売買損益: false
        };
        
        // Check each line for headers (check first 10 lines)
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
          const line = lines[i];
          console.log(`Line ${i}:`, line);
          
          // Check for exact matches and variations
          if (line.includes('決済約定日時') || line.includes('決済約定日')) {
            foundHeaders.決済約定日時 = true;
            console.log(`Found 決済約定日時 in line ${i}`);
          }
          if (line.includes('通貨ペア') || line.includes('通貨')) {
            foundHeaders.通貨ペア = true;
            console.log(`Found 通貨ペア in line ${i}`);
          }
          if (line.includes('売買')) {
            foundHeaders.売買 = true;
            console.log(`Found 売買 in line ${i}`);
          }
          if (line.includes('売買損益') || line.includes('損益')) {
            foundHeaders.売買損益 = true;
            console.log(`Found 売買損益 in line ${i}`);
          }
        }
        
        console.log('Found headers:', foundHeaders);
        
        // More flexible validation - require at least 3 out of 4 key headers
        const requiredHeaders = ['決済約定日時', '通貨ペア', '売買', '売買損益'];
        const foundCount = requiredHeaders.filter(header => {
          return foundHeaders[header as keyof typeof foundHeaders];
        }).length;
        
        console.log(`Found ${foundCount} out of ${requiredHeaders.length} required headers`);
        
        // Test for exact header format you provided
        const exactHeaderLine = '決済約定日時,注文番号,ポジション番号,通貨ペア,両建区分,注文手法,約定区分,執行条件,指定レート,売買,Lot数,新規約定日時,新規約定値,決済約定値,pip損益,円換算レート,売買損益,手数料,スワップ損益,決済損益,チャネル';
        const hasExactFormat = lines.some(line => line.trim() === exactHeaderLine);
        console.log('Has exact header format:', hasExactFormat);
        
        // Accept if we find at least 3 out of 4 headers OR the exact format
        const hasRequiredHeaders = foundCount >= 3 || hasExactFormat;
        
        return hasRequiredHeaders;
      } catch (error) {
        console.error('Error validating CSV file:', error);
        return false;
      }
    };
  
    // Import Hirose CSV
    const importHiroseCSV = async (file: File) => {
      try {
        setIsImporting(true);
        setImportProgress("CSVファイルを検証中...");
        
        // Validate CSV format
        const isValid = await validateHiroseCSV(file);
        if (!isValid) {
          setImportError("CSVファイルの形式が正しくありません。ヒロセ通商のCSVファイルをアップロードしてください。ブラウザのコンソールで詳細を確認できます。");
          setIsImporting(false);
          return;
        }
  
        setImportProgress("CSVファイルを解析中...");
        
        // Read CSV content with proper encoding
        let csvContent = await file.text();
        
        // Check if we have encoding issues and fix them
        if (csvContent.includes('')) {
          console.log('Fixing encoding for import...');
          const arrayBuffer = await file.arrayBuffer();
          
          try {
            const decoder = new TextDecoder('shift-jis');
            csvContent = decoder.decode(arrayBuffer);
            console.log('Successfully decoded import with Shift_JIS');
          } catch (shiftJisError) {
            console.log('Shift_JIS failed for import, trying other encodings...');
            
            const encodings = ['cp932', 'euc-jp', 'iso-2022-jp'];
            for (const encoding of encodings) {
              try {
                const decoder = new TextDecoder(encoding);
                csvContent = decoder.decode(arrayBuffer);
                console.log(`Successfully decoded import with ${encoding}`);
                break;
              } catch (e) {
                console.log(`${encoding} failed for import`);
              }
            }
          }
        }
        
        const lines = csvContent.split('\n');
        
        // Find the header row
        let headerIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('決済約定日時') && lines[i].includes('通貨ペア')) {
            headerIndex = i;
            break;
          }
        }
        
        if (headerIndex === -1) {
          setImportError("ヘッダー行が見つかりません。");
          setIsImporting(false);
          return;
        }
        
        // Process data rows
        const dataRows = lines.slice(headerIndex + 1).filter(line => line.trim());
        // Hirose CSV has 2 rows per transaction (entry and exit), so divide by 2
        const transactionCount = Math.floor(dataRows.length / 2);
        setImportProgress(`${transactionCount}件の取引を処理中...`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < dataRows.length; i++) {
          try {
            const row = dataRows[i];
            const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
            
            // Skip rows with empty essential data
            if (!values[3] || !values[16] || !values[11] || !values[0]) {
              continue;
            }
            
            // Parse Japanese date format and convert to local datetime string for localDateTimeToUTC
            const parseJapaneseDateTime = (dateTimeStr: string): string => {
              console.log("=== parseJapaneseDateTime Debug ===");
              console.log("Input dateTimeStr:", dateTimeStr);
              console.log("Input length:", dateTimeStr.length);
              
              // Split by multiple spaces and filter out empty parts
              const parts = dateTimeStr.split(/\s+/).filter(part => part.trim() !== '');
              console.log("Parts after split:", parts);
              console.log("Parts length:", parts.length);
              
              if (parts.length < 2) {
                console.log("Not enough parts, returning current time");
                return new Date().toISOString();
              }
              
              const datePart = parts[0];
              const timePart = parts[1];
              console.log("Date part:", datePart);
              console.log("Time part:", timePart);
              
              const [year, month, day] = datePart.split('/').map(Number);
              console.log("Parsed date:", { day, month, year });
              
              let [hours, minutes, seconds = '00'] = timePart.split(':');
              console.log("Parsed time components:", { hours, minutes, seconds });
              
              // Handle AM/PM if present
              if (parts.length > 2) {
                const ampm = parts[2];
                console.log("AM/PM part:", ampm);
                const hour = parseInt(hours);
                if (ampm === '午後' && hour !== 12) {
                  hours = (hour + 12).toString();
                  console.log("Converted to 24-hour format:", hours);
                } else if (ampm === '午前' && hour === 12) {
                  hours = '00';
                  console.log("Converted 12 AM to 00:", hours);
                }
              }
              
              // Create a Date object in local timezone and convert to UTC ISO string
              const localDate = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), parseInt(seconds));
              const utcResult = localDate.toISOString();
              console.log("Local date object:", localDate);
              console.log("Final UTC result:", utcResult);
              console.log("=== End parseJapaneseDateTime Debug ===");
              
              return utcResult;
            };
            
            // Convert lot size (10000 currency per lot to 1000 currency per lot)
            const convertLotSize = (lotSizeStr: string): number => {
              const lotSize = parseFloat(lotSizeStr);
              return lotSize / 10;
            };
            
            // Convert trade type (inverted because 決済約定日時 means exit, so 売買 is opposite)
            const convertTradeType = (buySellStr: string): number => {
              return buySellStr === '売' ? 0 : 1; // 売 (sell) = 0 (buy), 買 (buy) = 1 (sell)
            };
            
            // Calculate holding time (difference between settlement and new contract times)
            const calculateHoldTime = (entryTime: string, exitTime: string): number => {
              const entry = new Date(entryTime);
              const exit = new Date(exitTime);
              
              // Calculate time difference in seconds
              const timeDiffMs = exit.getTime() - entry.getTime();
              const timeDiffSeconds = Math.floor(timeDiffMs / 1000);
              
              // Ensure positive value (exit time should be after entry time)
              return Math.max(0, timeDiffSeconds);
            };
            
            // Get or create symbol
            const getOrCreateSymbol = async (symbolName: string): Promise<string> => {
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
              
              const { data: newSymbol, error: insertError } = await supabase
                .from('symbols')
                .insert({ symbol: symbolName })
                .select('id')
                .single();
              
              if (insertError) {
                throw new Error(`Error creating symbol: ${insertError.message}`);
              }
              
              return newSymbol.id;
            };
            
            // Parse trade data
            console.log("=== CSV Trade Data Parsing Debug ===");
            console.log("Raw entry time from CSV:", values[11]); // 新規約定日時
            console.log("Raw exit time from CSV:", values[0]);   // 決済約定日時
            
            const entryDateTime = parseJapaneseDateTime(values[11]); // 新規約定日時
            const exitDateTime = parseJapaneseDateTime(values[0]);   // 決済約定日時
            
            console.log("Parsed entry datetime:", entryDateTime);
            console.log("Parsed exit datetime:", exitDateTime);
            
            const entryTime = localDateTimeToUTC(entryDateTime);
            const exitTime = localDateTimeToUTC(exitDateTime);
            
            console.log("Final entry time (UTC):", entryTime);
            console.log("Final exit time (UTC):", exitTime);
            console.log("=== End CSV Trade Data Parsing Debug ===");
            const lotSize = convertLotSize(values[10]);          // Lot数
            const tradeType = convertTradeType(values[9]);       // 売買
            const profitLoss = parseFloat(values[16]);           // 売買損益
            const entryPrice = parseFloat(values[12]);           // 新規約定値
            const exitPrice = parseFloat(values[13]);            // 決済約定値
            const pips = (parseFloat(values[14]) || 0) / 10;     // pip損益 (divide by 10 for Hirose)
            const holdTime = calculateHoldTime(entryTime, exitTime);
            
            // Get or create symbol
            const symbolId = await getOrCreateSymbol(values[3]); // 通貨ペア
            
            // Trade memo should be empty
            const tradeMemo = "";
            
            // Insert trade into database
            const { error: insertError } = await supabase
              .from('trades')
              .insert({
                user_id: user.id,
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
              });
            
            if (insertError) {
              console.error(`Error inserting trade ${i + 1}:`, insertError);
              errorCount++;
            } else {
              successCount++;
              if (successCount % 10 === 0) {
                setImportProgress(`${successCount}/${transactionCount}件の取引を処理完了...`);
              }
            }
            
          } catch (rowError) {
            console.error(`Error processing row ${i + 1}:`, rowError);
            errorCount++;
          }
        }
        
        setImportProgress("");
        setImportSuccess(`${successCount}件の取引をインポートしました。${errorCount > 0 ? ` (${errorCount}件エラー)` : ''}`);
        
        // Close the dialog after successful import
        if (successCount > 0) {
          setTimeout(() => {
            onClose();
          }, 2000); // Close after 2 seconds to show success message
        }
        
      } catch (error) {
        console.error('Error importing CSV:', error);
        setImportError(`インポートエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsImporting(false);
      }
    };
  
    const handleImport = async () => {
      if (!csvFile) {
        setImportError("CSVファイルを選択してください。");
        return;
      }
      
      if (selectedBroker === "hirose") {
        await importHiroseCSV(csvFile);
      } else {
        setImportError("このブローカーのインポート機能はまだ実装されていません。");
      }
    };
  
    return (
      <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CSV インポート</DialogTitle>
            <DialogDescription>取引データをCSVファイルからインポートします</DialogDescription>
          </DialogHeader>
  
          <div className="space-y-4">
            <div>
              <Label htmlFor="broker">ブローカー</Label>
                <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger>
                  <SelectValue placeholder="ブローカーを選択" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="hirose">ヒロセ通商</SelectItem>
                  <SelectItem value="mt4">MetaTrader 4</SelectItem>
                  <SelectItem value="mt5">MetaTrader 5</SelectItem>
                </SelectContent>
              </Select>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800 mt-2"
                  onClick={() => setIsCustomBrokerOpen(true)}
                >
                  ブローカーがない？
                </Button>
            </div>
  
            <div>
              <Label htmlFor="csvFile">CSVファイル</Label>
                <Input 
                  id="csvFile" 
                  type="file" 
                  accept=".csv" 
                  onChange={handleMainCSVFileChange}
                  disabled={isImporting}
                />
                {csvFile && (
                  <p className="text-sm text-green-600 mt-1">
                    選択されたファイル: {csvFile.name}
                  </p>
                )}
            </div>
  
              {importProgress && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">{importProgress}</p>
                </div>
              )}
  
              {importError && (
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="text-sm text-red-800">{importError}</p>
                </div>
              )}
  
              {importSuccess && (
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-sm text-green-800">{importSuccess}</p>
                </div>
              )}
          </div>
  
          <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={onClose} disabled={isImporting}>
              キャンセル
            </Button>
              <Button 
                onClick={handleImport} 
                disabled={!csvFile || !selectedBroker || isImporting}
              >
                {isImporting ? "インポート中..." : "インポート"}
              </Button>
          </div>
        </DialogContent>
      </Dialog>
  
        {/* Custom Broker Request Dialog */}
        <Dialog open={isCustomBrokerOpen} onOpenChange={setIsCustomBrokerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>新しいブローカーの追加リクエスト</DialogTitle>
              <DialogDescription>
                サポートされていないブローカーのCSVファイルを送信して、自動インポート機能の追加をリクエストできます。
              </DialogDescription>
            </DialogHeader>
  
            <div className="space-y-4">
              <div>
                <Label htmlFor="brokerName">ブローカー名 *</Label>
                <Input
                  id="brokerName"
                  placeholder="例: FXCM, IG, Saxo Bank"
                  value={customBrokerName}
                  onChange={(e) => setCustomBrokerName(e.target.value)}
                />
              </div>
  
              <div>
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={customBrokerEmail}
                  onChange={(e) => setCustomBrokerEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  対応完了時に通知をお送りします
                </p>
              </div>
  
              <div>
                <Label htmlFor="csvSample">CSVファイルサンプル *</Label>
                <Input
                  id="csvSample"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFileChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  取引履歴のCSVファイルをアップロードしてください
                </p>
              </div>
  
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>注意:</strong> 開発チームがCSVファイルの形式を確認し、
                  自動インポート機能を実装いたします。対応には数日かかる場合があります。
                </p>
              </div>
            </div>
  
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsCustomBrokerOpen(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button 
                onClick={handleCustomBrokerSubmit}
                disabled={!customBrokerName.trim() || !customBrokerEmail.trim() || !customBrokerCSV || isSubmitting}
              >
                {isSubmitting ? "送信中..." : "リクエスト送信"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }