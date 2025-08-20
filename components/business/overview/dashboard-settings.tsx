import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DashboardSettings({ onSettingsChange }: { onSettingsChange?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [metricsPeriod, setMetricsPeriod] = useState<string>("1"); // Default to monthly (1)
    const [loading, setLoading] = useState(false);
    const user = useAuth();
    const { toast } = useToast();
  
    // Period options mapping
    const periodOptions = [
      { value: "0", label: "日次" },
      { value: "1", label: "月次" },
      { value: "2", label: "年次" },
      { value: "3", label: "総計" },
    ];
  
    // Load current settings
    useEffect(() => {
      if (!user || !isOpen) return;
  
      const loadSettings = async () => {
        try {
          const { data, error } = await supabase
            .from("dashboard_settings")
            .select("metrics_period")
            .eq("user_id", user.id)
            .single();
  
          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error("Error loading settings:", error);
            return;
          }
  
          if (data) {
            setMetricsPeriod(data.metrics_period?.toString() || "1");
          }
        } catch (error) {
          console.error("Error loading settings:", error);
        }
      };
  
      loadSettings();
    }, [user, isOpen]);
  
    // Save settings
    const handleSaveSettings = async () => {
      if (!user) return;
  
      setLoading(true);
      try {
        // First check if a row exists for this user
        const { data: existingSettings, error: checkError } = await supabase
          .from("dashboard_settings")
          .select("user_id")
          .eq("user_id", user.id)
          .single();
  
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
          throw checkError;
        }
  
        let error;
        if (existingSettings) {
          // Update existing row
          const { error: updateError } = await supabase
            .from("dashboard_settings")
            .update({ metrics_period: parseInt(metricsPeriod) })
            .eq("user_id", user.id);
          error = updateError;
        } else {
          // Insert new row if none exists
          const { error: insertError } = await supabase
            .from("dashboard_settings")
            .insert({
              user_id: user.id,
              metrics_period: parseInt(metricsPeriod),
            });
          error = insertError;
        }
  
        if (error) {
          throw error;
        }
  
        toast({
          title: "設定を保存しました",
          description: "パフォーマンス指標の期間設定が更新されました。",
        });
  
        // Trigger refresh of performance metrics
        if (onSettingsChange) {
          onSettingsChange();
        }
  
        setIsOpen(false);
      } catch (error: any) {
        console.error("Error saving settings:", error);
        toast({
          title: "エラーが発生しました",
          description: "設定の保存に失敗しました。",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">設定</span>
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ダッシュボード設定</DialogTitle>
            <DialogDescription>
              ダッシュボードの表示設定を変更できます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="performance-period" className="text-right">
                パフォーマンス指標期間:
              </Label>
              <div className="col-span-3">
                <Select value={metricsPeriod} onValueChange={setMetricsPeriod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="期間を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveSettings} disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }