import { supabase } from "@/lib/supabaseClient";

export interface TradeData {
  id: number;
  symbol_name: string;
  trade_type: number;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  pips: number;
  profit_loss: number;
  trade_memo: string;
  entry_time: string;
  exit_time: string;
  hold_time: number;
  tradeTags: string[];
  tradeEmotions: string[];
}

export const loadTrades = async (userId: string): Promise<{ data: TradeData[]; error?: string }> => {
  if (!userId) {
    return { data: [], error: "User not authenticated" };
  }

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
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error loading trades:", error);
      return { data: [], error: error.message };
    }

    // Transform data to include symbol_name, tags, and emotions
    const transformedData = data?.map(trade => ({
      ...trade,
      symbol_name: trade.symbols?.symbol,
      tradeTags: trade.trade_tag_links?.map((link: any) => link.trade_tags?.tag_name).filter(Boolean) || [],
      tradeEmotions: trade.trade_emotion_links?.map((link: any) => link.emotions?.emotion).filter(Boolean) || []
    })) || [];

    return { data: transformedData };
  } catch (error) {
    console.error("Error loading trades:", error);
    return { data: [], error: "Failed to load trades" };
  }
}; 