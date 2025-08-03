import { supabase } from "@/lib/supabaseClient";
import { utcToLocalDateTime } from "./timeUtils";
import { Trade } from "./types";

export interface TransformedTrade {
  id: number;
  date: string;
  time: string;
  entryTime: string;
  exitTime: string;
  pair: string;
  type: "買い" | "売り";
  entry: number;
  exit: number;
  lot: number;
  pips: number;
  profit: number;
  emotion: string[];
  holdingTime: number;
  holdingDays: number;
  holdingHours: number;
  holdingMinutes: number;
  notes: string;
  tags: string[];
}

export const transformTradeForEditing = (trade: any): TransformedTrade => {
  const tradeTags = trade.tradeTags || [];
  const tradeEmotions = trade.tradeEmotions || [];

  return {
    id: trade.id,
    date: trade.entry_time?.split("T")[0] || "",
    time: trade.entry_time?.split("T")[1]?.slice(0, 5) || "",
    entryTime: utcToLocalDateTime(trade.entry_time),
    exitTime: utcToLocalDateTime(trade.exit_time),
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
    notes: trade.trade_memo || "",
    tags: tradeTags,
  };
};

export const deleteTrade = async (tradeId: number, userId: string): Promise<{ success: boolean; error?: string }> => {
  if (!tradeId || !userId) {
    return { success: false, error: "Invalid trade ID or user ID" };
  }

  try {
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

    console.log("Trade deleted successfully");
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