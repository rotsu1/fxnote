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

export const loadSymbols = async (userId: string): Promise<{ data: string[]; error?: string }> => {
  if (!userId) {
    return { data: [], error: 'User not authenticated' }
  }
  try {
    const { data, error } = await supabase
      .from("symbols")
      .select("symbol")
      .eq('user_id', userId)
      .order("symbol")
    
    if (error) {
      console.error("Error loading symbols:", error)
      return { data: [], error: error.message }
    }
    
    const symbols = data?.map(item => item.symbol) || []
    return { data: symbols }
  } catch (error) {
    console.error("Error loading symbols:", error)
    return { data: [], error: "Failed to load symbols" }
  }
}

export const loadEmotions = async (userId: string): Promise<{ data: string[]; error?: string }> => {
  if (!userId) {
    return { data: [], error: "User not authenticated" };
  }

  try {
    const { data, error } = await supabase
      .from("emotions")
      .select("emotion")
      .eq("user_id", userId)
      .order("emotion")
    
    if (error) {
      console.error("Error loading emotions:", error)
      return { data: [], error: error.message }
    }
    
    const emotions = data?.map(item => item.emotion) || []
    return { data: emotions }
  } catch (error) {
    console.error("Error loading emotions:", error)
    return { data: [], error: "Failed to load emotions" }
  }
}

export interface TagData {
  id: number;
  tag_name: string;
}

export const loadTags = async (userId: string): Promise<{ data: TagData[]; error?: string }> => {
  if (!userId) {
    return { data: [], error: "User not authenticated" };
  }

  try {
    const { data, error } = await supabase
      .from("trade_tags")
      .select("id, tag_name")
      .eq("user_id", userId)
      .order("tag_name")
    
    if (error) {
      console.error("Error loading tags:", error)
      return { data: [], error: error.message }
    }
    
    return { data: data || [] }
  } catch (error) {
    console.error("Error loading tags:", error)
    return { data: [], error: "Failed to load tags" }
  }
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

/**
 * Generic function to load data for table editing
 */
export const loadDataForTable = async <T>(
  loaderFunction: () => Promise<{ data: T[]; error?: any }>,
  setterFunction: (data: T[]) => void,
  errorMessage: string
): Promise<void> => {
  try {
    const { data, error } = await loaderFunction();
    
    if (error) {
      console.error(errorMessage, error);
      return;
    }
    
    setterFunction(data);
  } catch (error) {
    console.error(errorMessage, error);
  }
}

/**
 * Load symbols for table editing
 */
export const loadSymbolsForTable = async (
  userId: string,
  setAvailableSymbols: (symbols: string[]) => void
): Promise<void> => {
  await loadDataForTable(
    () => loadSymbols(userId),
    setAvailableSymbols,
    "Error loading symbols for table:"
  );
}

/**
 * Load emotions for table editing
 */
export const loadEmotionsForTable = async (
  userId: string,
  setAvailableEmotions: (emotions: string[]) => void
): Promise<void> => {
  await loadDataForTable(
    () => loadEmotions(userId),
    setAvailableEmotions,
    "Error loading emotions for table:"
  );
} 
