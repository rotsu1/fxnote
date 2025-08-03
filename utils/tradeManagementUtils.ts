import { Trade } from "./types"
import { saveTrade } from "./tradeUtils"
import { supabase } from "@/lib/supabaseClient"

export interface TradeManagementOptions {
  user: any
  trades: Trade[]
  selectedTrades: Set<number>
}

export interface TradeSaveResult {
  success: boolean
  error?: string
}

/**
 * Handles trade selection logic
 */
export const handleTradeSelection = (
  id: number,
  checked: boolean,
  currentSelectedTrades: Set<number>
): Set<number> => {
  const newSet = new Set(currentSelectedTrades)
  if (checked) {
    newSet.add(id)
  } else {
    newSet.delete(id)
  }
  return newSet
}

/**
 * Handles select all trades logic
 */
export const handleSelectAllTrades = (
  checked: boolean,
  filteredTrades: Trade[]
): Set<number> => {
  if (checked) {
    return new Set(filteredTrades.map(trade => trade.id))
  } else {
    return new Set()
  }
}

/**
 * Handles trade saving logic
 */
export const handleTradeSave = async (
  tradeData: Partial<Trade>,
  editingTrade: any,
  user: any
): Promise<TradeSaveResult> => {
  const result = await saveTrade(tradeData, editingTrade, user)
  
  if (result?.success) {
    return { success: true }
  } else {
    return { 
      success: false, 
      error: result?.error || "取引の保存中にエラーが発生しました" 
    }
  }
}

/**
 * Handles trade deletion logic
 */
export const handleTradeDeletion = async (
  tradeIds: number[],
  user: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("trades")
      .delete()
      .in("id", tradeIds)
      .eq("user_id", user.id)
    
    if (error) throw error
    
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting trade:", error)
    return { success: false, error: error.message }
  }
} 