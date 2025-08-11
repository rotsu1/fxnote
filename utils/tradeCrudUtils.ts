import { supabase } from "@/lib/supabaseClient";
import { utcToLocalDateTime } from "./timeUtils";
import { Trade } from "./types";
// performance metrics removed

export const transformTradeForEditing = (trade: any): Trade => {
  const tradeTags = trade.tradeTags || [];
  const tradeEmotions = trade.tradeEmotions || [];

  // Convert UTC date/time parts from DB into a local datetime string for UI inputs
  const toLocalDateTime = (dateStr?: string, timeStr?: string): string => {
    if (!dateStr || !timeStr) return "";
    const [hh = "00", mm = "00", ss = "00"] = (timeStr || "00:00:00").split(":");
    const isoUtc = `${dateStr}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}Z`;
    return utcToLocalDateTime(isoUtc);
  };

  return {
    id: trade.id,
    date: trade.entry_date || "",
    time: (trade.entry_time || "").slice(0, 5) || "",
    entryTime: toLocalDateTime(trade.entry_date, trade.entry_time),
    exitTime: toLocalDateTime(trade.exit_date, trade.exit_time),
    entryDate: trade.entry_date || "",
    exitDate: trade.exit_date || "",
    pair: trade.symbol_name || "",
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
    holdingSeconds: trade.hold_time ? Math.floor(trade.hold_time % 60) : 0,
    notes: trade.trade_memo || "",
    tags: tradeTags,
  } as Trade;
};

export const deleteTrade = async (tradeId: number, userId: string): Promise<{ success: boolean; error?: string }> => {
  if (!tradeId || !userId) {
    return { success: false, error: "Invalid trade ID or user ID" };
  }

  try {
    // First, get the trade data before deletion for performance metrics update
    const { data: tradeData, error: fetchError } = await supabase
      .from("trades")
      .select("*")
      .eq("id", tradeId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching trade data:", fetchError);
      return { success: false, error: "取引データの取得中にエラーが発生しました" };
    }

    // Delete trade emotion links
    const { error: emotionError } = await supabase
      .from("trade_emotion_links")
      .delete()
      .eq("trade_id", tradeId);

    if (emotionError) {
      console.error("Error deleting trade emotion links:", emotionError);
    }

    // Delete trade tag links
    const { error: tagError } = await supabase
      .from("trade_tag_links")
      .delete()
      .eq("trade_id", tradeId);

    if (tagError) {
      console.error("Error deleting trade tag links:", tagError);
    }

    // Delete the main trade record
    const { error: tradeError } = await supabase
      .from("trades")
      .delete()
      .eq("id", tradeId)
      .eq("user_id", userId);

    if (tradeError) {
      console.error("Error deleting trade:", tradeError);
      return { success: false, error: "取引の削除中にエラーが発生しました" };
    }

    // Performance metrics removed; no update needed
    if (tradeData) {
      // no-op
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting trade:", error);
    return { success: false, error: "取引の削除中にエラーが発生しました" };
  }
};

export const loadUserTags = async (userId: string): Promise<{ id: number; tag_name: string }[]> => {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from("trade_tags")
      .select("id, tag_name")
      .eq("user_id", userId)
      .order("tag_name");
    
    if (error) {
      console.error("Error loading tags:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error loading tags:", error);
    return [];
  }
}; 