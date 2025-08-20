import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { importHiroseTradesFromFile } from '@/utils/parser/hiroseParser';

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
  
    // Import Hirose CSV
    const importHiroseCSV = async (file: File) => {
      setIsImporting(true);
      setImportError("");
      setImportSuccess("");
      
      try {
        setImportProgress("CSVファイルを処理中...");
        
        // Use the utility function from hiroseParser
        const { successCount, errorCount } = await importHiroseTradesFromFile(file, user.id);
        
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