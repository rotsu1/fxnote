import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient";

export function CSVImportDialog({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: any }) {
    // Lightweight text sanitizer for free-text fields heading to DB (CSV formula guard)
    const sanitizeText = (value: string): string => {
      let v = String(value ?? '')
      v = v.replace(/^[\uFEFF]/, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim()
      if (!v) return ''
      const danger = ['=', '+', '-', '@']
      if (danger.includes(v[0])) v = "'" + v
      if (v.length > 256) v = v.slice(0, 256)
      return v
    }
    const [isCustomBrokerOpen, setIsCustomBrokerOpen] = useState(false);
    const [customBrokerName, setCustomBrokerName] = useState("");
    const [customBrokerCSV, setCustomBrokerCSV] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string>("");
    const [submitSuccess, setSubmitSuccess] = useState<string>("");
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
      setSubmitError("");
      setSubmitSuccess("");
      if (!customBrokerName.trim() || !customBrokerCSV) {
        setSubmitError("ブローカー名とCSVファイルを入力してください。");
        return;
      }
      setIsSubmitting(true);
      try {
        const { data: s } = await supabase.auth.getSession();
        const uid = s.session?.user.id;
        if (!uid) {
          setSubmitError("認証が必要です。ログインし直してください。");
          setIsSubmitting(false);
          return;
        }

        // Basic client-side validation
        const MAX_BYTES = 5 * 1024 * 1024; // 5MB
        if (customBrokerCSV.size > MAX_BYTES) {
          setSubmitError("ファイルサイズが大きすぎます（最大 5MB）。");
          setIsSubmitting(false);
          return;
        }
        const lower = customBrokerCSV.name.toLowerCase()
        const mime = (customBrokerCSV.type || '').toLowerCase()
        if (!lower.endsWith('.csv') && !mime.includes('csv') && mime !== 'application/vnd.ms-excel') {
          setSubmitError("CSVファイル（.csv）をアップロードしてください。");
          setIsSubmitting(false);
          return;
        }

        // Upload CSV to user-uploads bucket under users/<uid>/csv-uploads/<uuid>.csv
        const objectPath = `users/${uid}/csv-uploads/${(globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2))}.csv`;
        const { error: upErr } = await supabase
          .storage
          .from('user-uploads')
          .upload(objectPath, customBrokerCSV, { contentType: customBrokerCSV.type || 'text/csv' });
        if (upErr) {
          console.error('[custom-broker] upload error', upErr);
          setSubmitError("CSVのアップロードに失敗しました。");
          setIsSubmitting(false);
          return;
        }

        // Create parser request via RPC (RLS-safe, checks path ownership)
        const { error: rpcErr } = await supabase.rpc('request_csv_parser', {
          p_broker: sanitizeText(customBrokerName.trim()),
          p_storage_path: objectPath,
          p_original_filename: sanitizeText(customBrokerCSV.name),
        });
        if (rpcErr) {
          console.error('[custom-broker] rpc error', rpcErr);
          setSubmitError("リクエスト作成に失敗しました。");
          setIsSubmitting(false);
          return;
        }

        setSubmitSuccess("リクエストを送信しました。対応までお待ちください。");
        // Reset form after brief delay
        setTimeout(() => {
          setCustomBrokerName("");
          setCustomBrokerCSV(null);
          setIsCustomBrokerOpen(false);
        }, 1200);
      } catch (error) {
        console.error("Error submitting custom broker request:", error);
        setSubmitError("エラーが発生しました。もう一度お試しください。");
      } finally {
        setIsSubmitting(false);
      }
    };
  
    const handleCSVFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && (file.type === "text/csv" || file.name.toLowerCase().endsWith('.csv'))) {
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
        setImportProgress("CSVファイルをアップロード中...");
        const { data: s } = await supabase.auth.getSession();
        const token = s.session?.access_token;
        if (!token) {
          setImportProgress("");
          setImportError("認証が必要です。再ログインしてください。");
          return;
        }

        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/import-trades', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        const json = await res.json();
        if (!res.ok) {
          setImportProgress("");
          setImportError(json?.error || "インポートに失敗しました");
          return;
        }

        const { successCount, errorCount } = json as { successCount: number; errorCount: number };
        
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
                  placeholder="例: DMM, GMO, 楽天証券"
                  value={customBrokerName}
                  onChange={(e) => setCustomBrokerName(e.target.value)}
                />
              </div>

              {submitError && (
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              )}

              {submitSuccess && (
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-sm text-green-800">{submitSuccess}</p>
                </div>
              )}
  
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
                disabled={!customBrokerName.trim() || !customBrokerCSV || isSubmitting}
              >
                {isSubmitting ? "送信中..." : "リクエスト送信"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }
