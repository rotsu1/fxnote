"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
import { MonthlyNavigation } from "@/components/ui/monthly-navigation"

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { TradeEditDialog } from "@/components/ui/trade-edit-dialog"

import { saveTrade } from "@/utils/tradeUtils"
import { localDateTimeToUTC, utcToLocalDateTime, formatHoldTime, groupTradesByDate } from "@/utils/timeUtils"
import { CalendarGrid } from "@/components/ui/calendar-grid"
import { RightSidebar } from "@/components/ui/right-sidebar"

interface Trade {
  id: number
  date: string
  time: string
  entryTime?: string
  exitTime?: string
  pair: string
  type: "買い" | "売り"
  entry: number
  exit: number
  lot?: number
  pips: number
  profit: number
  emotion: string[]
  holdingTime: number
  holdingDays?: number
  holdingHours?: number
  holdingMinutes?: number
  notes?: string
  tags: string[]
}

function CSVImportDialog({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: any }) {
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

function DisplaySettingsDialog({ 
  isOpen, 
  onClose, 
  displaySettings, 
  onSaveSettings 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  displaySettings: Record<string, boolean>;
  onSaveSettings: (settings: Record<string, boolean>) => void;
}) {
  const [settings, setSettings] = useState<Record<string, boolean>>(displaySettings);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(displaySettings);
      setHasUnsavedChanges(false);
    }
  }, [displaySettings, isOpen]);

  const handleSettingChange = (settingId: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [settingId]: checked }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    onSaveSettings(settings);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardWarning(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    setShowDiscardWarning(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>表示設定</DialogTitle>
          <DialogDescription>取引履歴カードの表示項目を設定します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {[
              { id: "show_symbol", label: "シンボル", checked: true, disabled: true },
              { id: "show_profit", label: "損益", checked: true, disabled: true },
              { id: "show_direction", label: "ロング/ショート", checked: true, disabled: false },
              { id: "show_entry_time", label: "エントリー時間", checked: true, disabled: false },
              { id: "show_exit_time", label: "エグジット時間", checked: true, disabled: false },
              { id: "show_entry_price", label: "エントリー価格", checked: true, disabled: false },
              { id: "show_exit_price", label: "エグジット価格", checked: true, disabled: false },
              { id: "show_lot", label: "ロット", checked: true, disabled: false },
              { id: "show_pips", label: "pips", checked: true, disabled: false },
              { id: "show_hold_time", label: "保有時間", checked: true, disabled: false },
              { id: "show_emotion", label: "感情", checked: true, disabled: false },
              { id: "show_tag", label: "タグ", checked: true, disabled: false },
              { id: "show_note", label: "メモ", checked: true, disabled: false },
          ].map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={item.id} 
                  checked={settings[item.id] || false}
                  disabled={item.disabled}
                  onCheckedChange={(checked) => {
                    if (!item.disabled) {
                      handleSettingChange(item.id, checked as boolean);
                    }
                  }}
                />
                <Label htmlFor={item.id} className={item.disabled ? "text-gray-500" : ""}>
                  {item.label}
                </Label>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
            <Button onClick={handleSave}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>

      {/* Discard Changes Warning Dialog */}
      <AlertDialog open={showDiscardWarning} onOpenChange={setShowDiscardWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>設定を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                保存されていない設定変更があります。
              </p>
              <p className="text-red-600">
                ⚠️ 現在の設定変更は破棄されます。
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                この操作は取り消すことができません。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardWarning(false)}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDiscard}
              className="bg-red-600 hover:bg-red-700"
            >
              破棄
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function CalendarPage() {
  const user = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  const [editingTrade, setEditingTrade] = useState<any>(null);
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState<boolean>(false);
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState<boolean>(false);
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState<boolean>(false);
  const [deleteTradeId, setDeleteTradeId] = useState<number | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<{ id: number, tag_name: string }[]>([]);
  const [displaySettings, setDisplaySettings] = useState<Record<string, boolean>>({
    show_symbol: true,
    show_direction: true,
    show_entry_price: true,
    show_exit_price: true,
    show_entry_time: true,
    show_exit_time: true,
    show_hold_time: true,
    show_emotion: true,
    show_tag: true,
    show_lot: true,
    show_pips: true,
    show_profit: true,
    show_note: true,
  });

  // Load display settings from database
  const loadDisplaySettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("trade_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error loading display settings:", error);
        return;
      }
      
      if (data) {
        setDisplaySettings({
          show_symbol: data.show_symbol ?? true,
          show_direction: data.show_direction ?? true,
          show_entry_price: data.show_entry_price ?? true,
          show_exit_price: data.show_exit_price ?? true,
          show_entry_time: data.show_entry_time ?? true,
          show_exit_time: data.show_exit_time ?? true,
          show_hold_time: data.show_hold_time ?? true,
          show_emotion: data.show_emotion ?? true,
          show_tag: data.show_tag ?? true,
          show_lot: data.show_lot ?? true,
          show_pips: data.show_pips ?? true,
          show_profit: data.show_profit ?? true,
          show_note: data.show_note ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading display settings:", error);
    }
  };

  useEffect(() => {
    loadTrades();
    if (!user) return;
    const loadTags = async () => {
      const { data, error } = await supabase
        .from("trade_tags")
        .select("id, tag_name")
        .eq("user_id", user.id)
        .order("tag_name");
      if (error) {
        console.error("Error loading tags for table:", error);
        setAvailableTags([]);
        return;
      }
      setAvailableTags(data || []);
    };
    loadTags();
  }, [user]);

  // Function to load trades
  const loadTrades = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("trades")
        .select(`
          *,
          symbols!inner(symbol),
          trade_tag_links(
            trade_tags(tag_name)
          ),
          trade_emotion_links(
            emotions(emotion)
          )
        `)
        .eq("user_id", user.id);
      
      if (error) {
        setError(error.message);
        setTrades([]);
      } else {
        // Transform data to include symbol_name, tags, and emotions
        const transformedData = data?.map(trade => ({
          ...trade,
          symbol_name: trade.symbols?.symbol,
          tradeTags: trade.trade_tag_links?.map((link: any) => link.trade_tags?.tag_name).filter(Boolean) || [],
          tradeEmotions: trade.trade_emotion_links?.map((link: any) => link.emotions?.emotion).filter(Boolean) || []
        })) || [];
        setTrades(transformedData);
      }
    } catch (error) {
      setError("Failed to load trades");
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  // Load display settings when user changes
  useEffect(() => {
    loadDisplaySettings();
  }, [user]);

  const groupedTrades = groupTradesByDate(trades);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setIsRightSidebarOpen(true);
  };

  const handleEditTrade = async (trade: any) => {
    try {
      // Use pre-loaded trade data
      const tradeTags = trade.tradeTags || [];
      const tradeEmotions = trade.tradeEmotions || [];

      // Transform database trade data to form format
      const transformedTrade = {
        id: trade.id,
        date: trade.entry_time?.split("T")[0] || "",
        time: trade.entry_time?.split("T")[1]?.slice(0, 5) || "",
        entryTime: utcToLocalDateTime(trade.entry_time),
        exitTime: utcToLocalDateTime(trade.exit_time),
        pair: trade.symbol_name || "", // Use symbol name for display
        type: trade.trade_type === 0 ? "買い" : "売り",
        entry: trade.entry_price,
        exit: trade.exit_price,
        lot: trade.lot_size,
        pips: trade.pips,
        profit: trade.profit_loss,
        emotion: tradeEmotions,
        holdingTime: trade.hold_time || 0,
        holdingDays: trade.hold_time ? Math.floor(trade.hold_time / (24 * 60 * 60)) : 0,
        holdingHours: trade.hold_time ? Math.floor((trade.hold_time % (24 * 60 * 60)) / (60 * 60)) : 0,
        holdingMinutes: trade.hold_time ? Math.floor((trade.hold_time % (60 * 60)) / 60) : 0,
        notes: trade.trade_memo || "",
        tags: tradeTags,
      };
      
      console.log("Transformed trade for editing:", transformedTrade);
      setEditingTrade(transformedTrade);
    setIsTradeDialogOpen(true);
    } catch (error) {
      console.error("Error preparing trade for editing:", error);
      setError("取引の編集準備中にエラーが発生しました");
    } finally {

    }
  };

  const handleAddTrade = () => {
    setEditingTrade(null);
    // If no date is selected, use today's date
    if (!selectedDate) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
    }
    setIsTradeDialogOpen(true);
  };

  const handleSaveTrade = async (tradeData: Partial<Trade>) => {
    const result = await saveTrade(tradeData, editingTrade, user);
    
    if (result?.success) {
      setIsTradeDialogOpen(false);
      setEditingTrade(null);
      // Refresh trades data to show the new/updated trade
      await loadTrades();
    } else {
      setError(result?.error || "取引の保存中にエラーが発生しました");
    }
  };

  const handleDeleteTrade = (id: number) => {
    setDeleteTradeId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTradeId || !user) {
      setDeleteTradeId(null);
      return;
    }

    try {
      // Delete related records first (foreign key constraints)
      
      // Delete trade emotion links
      const { error: emotionError } = await supabase
        .from("trade_emotion_links")
        .delete()
        .eq("trade_id", deleteTradeId);

      if (emotionError) {
        console.error("Error deleting trade emotion links:", emotionError);
      }

      // Delete trade tag links
      const { error: tagError } = await supabase
        .from("trade_tag_links")
        .delete()
        .eq("trade_id", deleteTradeId);

      if (tagError) {
        console.error("Error deleting trade tag links:", tagError);
      }

      // Delete the main trade record
      const { error: tradeError } = await supabase
        .from("trades")
        .delete()
        .eq("id", deleteTradeId)
        .eq("user_id", user.id);

      if (tradeError) {
        console.error("Error deleting trade:", tradeError);
        setError("取引の削除中にエラーが発生しました");
        return;
      }

      // Refresh the trades data
      await loadTrades();
      
      console.log("Trade deleted successfully");
    } catch (error) {
      console.error("Error deleting trade:", error);
      setError("取引の削除中にエラーが発生しました");
    } finally {
      setDeleteTradeId(null);
    }
  };

  const handleSaveDisplaySettings = async (settings: Record<string, boolean>) => {
    if (!user) return;
    
    try {
      // Check if settings exist for this user
      const { data: existingSettings, error: checkError } = await supabase
        .from("trade_settings")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing settings:", checkError);
        return;
      }
      
      const settingsData = {
        user_id: user.id,
        show_symbol: settings.show_symbol,
        show_direction: settings.show_direction,
        show_entry_price: settings.show_entry_price,
        show_exit_price: settings.show_exit_price,
        show_entry_time: settings.show_entry_time,
        show_exit_time: settings.show_exit_time,
        show_hold_time: settings.show_hold_time,
        show_emotion: settings.show_emotion,
        show_tag: settings.show_tag,
        show_lot: settings.show_lot,
        show_pips: settings.show_pips,
        show_profit: settings.show_profit,
        show_note: settings.show_note,
        updated_at: new Date().toISOString(),
      };
      
      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from("trade_settings")
          .update(settingsData)
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Error updating display settings:", updateError);
          return;
        }
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from("trade_settings")
          .insert([{
            ...settingsData,
            created_at: new Date().toISOString(),
          }]);
        
        if (insertError) {
          console.error("Error inserting display settings:", insertError);
          return;
        }
      }
      
      // Update local state
      setDisplaySettings(settings);
      console.log("Display settings saved successfully");
    } catch (error) {
      console.error("Error saving display settings:", error);
    }
  };

  const selectedTrades = groupedTrades[selectedDate] || [];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">カレンダー</h1>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-10">{error}</div>
          ) : (
            <>
              <MonthlyNavigation currentDate={currentDate} onDateChange={setCurrentDate} trades={trades} onImportCSV={() => setIsCSVDialogOpen(true)} />
              <CalendarGrid currentDate={currentDate} onDateClick={handleDateClick} groupedTrades={groupedTrades} />
            </>
          )}
        </main>
        <RightSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          selectedDate={selectedDate}
          trades={selectedTrades}
          onEditTrade={handleEditTrade}
          onDeleteTrade={handleDeleteTrade}
          onAddTrade={handleAddTrade}
          onDisplaySettings={() => setIsDisplaySettingsOpen(true)}
          displaySettings={displaySettings}
        />
        <TradeEditDialog
          trade={editingTrade}
          isOpen={isTradeDialogOpen}
          onClose={() => setIsTradeDialogOpen(false)}
          onSave={handleSaveTrade}
          defaultDate={selectedDate || undefined}
          user={user}
          availableTags={availableTags}
        />
        <CSVImportDialog 
          isOpen={isCSVDialogOpen} 
          onClose={() => {
            setIsCSVDialogOpen(false);
            // Refresh trades data after CSV import
            loadTrades();
          }} 
          user={user} 
        />
        <DisplaySettingsDialog 
          isOpen={isDisplaySettingsOpen} 
          onClose={() => setIsDisplaySettingsOpen(false)}
          displaySettings={displaySettings}
          onSaveSettings={handleSaveDisplaySettings}
        />
        <AlertDialog open={deleteTradeId !== null} onOpenChange={() => setDeleteTradeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>取引を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消すことができません。取引データが完全に削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>削除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
