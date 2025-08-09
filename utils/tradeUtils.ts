import { supabase } from "@/lib/supabaseClient";
import { localDateTimeToUTC } from "./timeUtils";

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

const ensureTimeWithSeconds = (t: string): string => {
  if (!t) return "00:00:00";
  const [hh = "00", mm = "00", ss] = t.split(":");
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String((ss ?? "00")).padStart(2, "0")}`;
};

const splitDateTime = (localDateTime?: string): { date: string | null; time: string | null } => {
  if (!localDateTime) return { date: null, time: null };
  const [datePart, timePartRaw] = localDateTime.split("T");
  const timePart = ensureTimeWithSeconds(timePartRaw || "00:00:00");
  return { date: datePart || null, time: timePart || null };
};

const combineToISO = (dateStr?: string | null, timeStr?: string | null): string => {
  if (!dateStr || !timeStr) return new Date().toISOString();
  const local = `${dateStr}T${ensureTimeWithSeconds(timeStr)}`;
  return localDateTimeToUTC(local);
};

const toUTCDateAndTime = (localDateTime?: string): { date: string | null; time: string | null } => {
  const { date, time } = splitDateTime(localDateTime || "");
  if (!date || !time) return { date: null, time: null };
  const utcIso = combineToISO(date, time); // UTC ISO string
  const d = new Date(utcIso);
  const yyyy = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const HH = String(d.getUTCHours()).padStart(2, '0');
  const MM = String(d.getUTCMinutes()).padStart(2, '0');
  const SS = String(d.getUTCSeconds()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}:${SS}` };
};

export const saveTrade = async (tradeData: Partial<Trade>, editingTrade: Trade, user: any) => {
    if (!user) return;
    
    try {
      // Get or create symbol ID
      let symbolId = null;
      if (tradeData.pair) {
        // First try to find existing symbol
        let { data: symbolData, error: symbolError } = await supabase
          .from("symbols")
          .select("id")
          .eq("symbol", tradeData.pair)
          .single();
        
        if (symbolError && symbolError.code === 'PGRST116') {
          // Symbol doesn't exist, create it
          const { data: newSymbol, error: createError } = await supabase
            .from("symbols")
            .insert([{ symbol: tradeData.pair }])
            .select()
            .single();
          
          if (createError) {
            console.error("Error creating symbol:", createError);
            throw createError;
          }
          symbolId = newSymbol.id;
        } else if (symbolError) {
          console.error("Error finding symbol:", symbolError);
          throw symbolError;
        } else if (symbolData) {
          symbolId = symbolData.id;
        }
      }

      const entryUtc = toUTCDateAndTime(tradeData.entryTime);
      const exitUtc = toUTCDateAndTime(tradeData.exitTime);

      if (editingTrade?.id) {
        // Update existing trade
        const { error } = await supabase
          .from("trades")
          .update({
            symbol: symbolId,
            trade_type: tradeData.type === "買い" ? 0 : 1,
            lot_size: tradeData.lot,
            entry_price: tradeData.entry,
            exit_price: tradeData.exit,
            pips: tradeData.pips,
            profit_loss: tradeData.profit,
            trade_memo: tradeData.notes,
            entry_date: entryUtc.date,
            entry_time: entryUtc.time,
            exit_date: exitUtc.date,
            exit_time: exitUtc.time,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTrade.id)
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        // Refresh the data
        const event = new Event('tradeUpdated');
        window.dispatchEvent(event);
        
      } else {
        // Add new trade
        const { data, error } = await supabase
          .from("trades")
          .insert([{
            user_id: user.id,
            symbol: symbolId,
            trade_type: tradeData.type === "買い" ? 0 : 1,
            lot_size: tradeData.lot,
            entry_price: tradeData.entry,
            exit_price: tradeData.exit,
            pips: tradeData.pips,
            profit_loss: tradeData.profit,
            trade_memo: tradeData.notes,
            entry_date: entryUtc.date,
            entry_time: entryUtc.time,
            exit_date: exitUtc.date,
            exit_time: exitUtc.time,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
          // Refresh the data
          const event = new Event('tradeUpdated');
          window.dispatchEvent(event);
        }
      }
      return { success: true };
    } catch (error: any) {
      console.error("Error saving trade:", error);
      return { success: false, error: error.message };
    }
};