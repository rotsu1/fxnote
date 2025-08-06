import { supabase } from '../../lib/supabaseClient';

// Types for the trade input
export interface TradeInput {
  user_id: string;
  exit_time: string | Date;
  profit_loss: number;
  pips: number;
  hold_time: number; // in seconds
  trade_type?: number;
  entry_time?: string | Date;
}

// Types for the performance metrics table
export interface UserPerformanceMetric {
  user_id: string;
  period_type: 'daily' | 'monthly';
  period_value: string;
  win_count: number;
  loss_count: number;
  win_profit: number;
  loss_loss: number;
  win_pips: number;
  loss_pips: number;
  win_holding_time: number; // Total holding time for wins in seconds
  loss_holding_time: number; // Total holding time for losses in seconds
  win_pips_count: number; // Count of trades with pips for wins
  loss_pips_count: number; // Count of trades with pips for losses
  win_holding_count: number; // Count of trades with holding time for wins
  loss_holding_count: number; // Count of trades with holding time for losses
  created_at?: string;
  updated_at?: string;
}

// Period type definition
type PeriodType = 'daily' | 'monthly';

/**
 * Cleans and validates a period value string
 */
function cleanPeriodValue(periodValue: string): string {
  if (!periodValue) return periodValue;
  // Remove any leading/trailing whitespace and normalize
  // Also ensure the value is URL-safe for Supabase queries
  return periodValue.trim();
}

/**
 * Extracts period values from exit_time for different time resolutions
 * Assumes exit_time is already in UTC format
 */
function extractPeriodValues(exitTime: string | Date): Record<PeriodType, string> {
  const date = new Date(exitTime);
  
  // Ensure the date is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid exit_time provided');
  }

  // For daily, monthly - convert UTC to local time for calendar periods
  // This ensures calendar periods are based on the user's local calendar
  const localDate = new Date(date.getTime());
  const localYear = localDate.getFullYear();
  const localMonth = String(localDate.getMonth() + 1).padStart(2, '0');
  const localDay = String(localDate.getDate()).padStart(2, '0');

  const periodValues = {
    daily: `${localYear}-${localMonth}-${localDay}`, // Use local time for calendar day
    monthly: `${localYear}-${localMonth}` // Use local time for calendar month
  };

  // Clean all period values to ensure consistency
  Object.keys(periodValues).forEach(key => {
    periodValues[key as PeriodType] = cleanPeriodValue(periodValues[key as PeriodType]);
  });

  return periodValues;
}

/**
 * Updates user performance metrics after a trade is inserted
 * @param trade - The trade object containing user_id, exit_time, profit_loss, pips, and hold_time
 * @returns Promise<void>
 */
export async function updateUserPerformanceMetrics(trade: TradeInput): Promise<void> {
  try {
    // Extract period values from exit_time
    const periodValues = extractPeriodValues(trade.exit_time);
    
    // Debug logging
    console.log('Adding trade to performance metrics:', {
      trade_id: trade.user_id,
      profit_loss: trade.profit_loss,
      pips: trade.pips,
      exit_time: trade.exit_time
    });
    
    // Determine if this is a win or loss
    const isWin = trade.profit_loss >= 0;
    
    // Process each period type
    const updatePromises = Object.entries(periodValues).map(async ([periodType, periodValue]) => {
      const typedPeriodType = periodType as PeriodType;
      const cleanedPeriodValue = cleanPeriodValue(periodValue);
      
      // Get existing metric record
      let existingMetric = null;
      let fetchError = null;
      
      try {
        const result = await supabase
          .from('user_performance_metrics')
          .select('*')
          .eq('user_id', trade.user_id)
          .eq('period_type', typedPeriodType)
          .eq('period_value', cleanedPeriodValue)
          .maybeSingle();
        
        existingMetric = result.data;
        fetchError = result.error;
      } catch (error: any) {
        console.warn(`Error fetching existing metric for ${periodType}: ${error.message}`);
        // Continue with creating a new record instead of throwing
      }

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.warn(`Error fetching existing metric for ${periodType}: ${fetchError.message}`);
        // Continue with creating a new record instead of throwing
      }

      let updatedMetric: Partial<UserPerformanceMetric>;

      if (!existingMetric) {
        // Create new record with initial values
        const tradeProfit = Math.abs(Number(trade.profit_loss));
        const tradePips = Math.abs(Number(trade.pips));
        
        console.log(`Creating new metric for ${periodType}:`, {
          isWin,
          tradeProfit,
          tradePips
        });
        
        updatedMetric = {
          user_id: trade.user_id,
          period_type: typedPeriodType,
          period_value: periodValue,
          win_count: isWin ? 1 : 0,
          loss_count: isWin ? 0 : 1,
          win_profit: isWin ? tradeProfit : 0,
          loss_loss: isWin ? 0 : -tradeProfit, // Store loss as negative value
          win_pips: isWin ? tradePips : 0,
          loss_pips: isWin ? 0 : -tradePips, // Store loss pips as negative value
          win_holding_time: isWin ? trade.hold_time : 0,
          loss_holding_time: isWin ? 0 : trade.hold_time,
          win_pips_count: isWin && tradePips > 0 ? 1 : 0,
          loss_pips_count: !isWin && tradePips > 0 ? 1 : 0,
          win_holding_count: isWin && (trade.entry_time && trade.exit_time) ? 1 : 0,
          loss_holding_count: !isWin && (trade.entry_time && trade.exit_time) ? 1 : 0,
          updated_at: new Date().toISOString()
        };
      } else {
        // Update existing record
        const currentWinCount = existingMetric.win_count || 0;
        const currentLossCount = existingMetric.loss_count || 0;
        const currentWinProfit = Number(existingMetric.win_profit || 0);
        const currentLossLoss = Number(existingMetric.loss_loss || 0);
        const currentWinPips = Number(existingMetric.win_pips || 0);
        const currentLossPips = Number(existingMetric.loss_pips || 0);
        const currentWinHoldingTime = existingMetric.win_holding_time || 0;
        const currentLossHoldingTime = existingMetric.loss_holding_time || 0;
        const currentWinPipsCount = existingMetric.win_pips_count || 0;
        const currentLossPipsCount = existingMetric.loss_pips_count || 0;
        const currentWinHoldingCount = existingMetric.win_holding_count || 0;
        const currentLossHoldingCount = existingMetric.loss_holding_count || 0;

        if (isWin) {
          // Update win-related metrics
          const tradeProfit = Math.abs(Number(trade.profit_loss));
          const tradePips = Math.abs(Number(trade.pips));
          
          const newWinCount = currentWinCount + 1;
          const newWinProfit = currentWinProfit + tradeProfit;
          const newWinPips = currentWinPips + tradePips;
          const newWinHoldingTime = currentWinHoldingTime + trade.hold_time;
          const newWinPipsCount = currentWinPipsCount + (tradePips > 0 ? 1 : 0);
          const newWinHoldingCount = currentWinHoldingCount + (trade.entry_time && trade.exit_time ? 1 : 0);
          
          console.log(`Adding win trade to ${periodType}:`, {
            currentWinProfit,
            tradeProfit,
            newWinProfit,
            currentWinPips,
            tradePips,
            newWinPips
          });
          
          updatedMetric = {
            win_count: newWinCount,
            win_profit: newWinProfit,
            win_pips: newWinPips,
            win_holding_time: newWinHoldingTime,
            win_pips_count: newWinPipsCount,
            win_holding_count: newWinHoldingCount,
            updated_at: new Date().toISOString()
          };
        } else {
          // Update loss-related metrics
          const tradeLoss = Math.abs(Number(trade.profit_loss));
          const tradePips = Math.abs(Number(trade.pips));
          
          const newLossCount = currentLossCount + 1;
          const newLossLoss = currentLossLoss - tradeLoss;
          const newLossPips = currentLossPips - tradePips;
          const newLossHoldingTime = currentLossHoldingTime + trade.hold_time;
          const newLossPipsCount = currentLossPipsCount + (tradePips > 0 ? 1 : 0);
          const newLossHoldingCount = currentLossHoldingCount + (trade.entry_time && trade.exit_time ? 1 : 0);

          console.log(`Adding loss trade to ${periodType}:`, {
            currentLossLoss,
            tradeLoss,
            newLossLoss,
            currentLossPips,
            tradePips,
            newLossPips
          });

          updatedMetric = {
            loss_count: newLossCount,
            loss_loss: newLossLoss,
            loss_pips: newLossPips,
            loss_holding_time: newLossHoldingTime,
            loss_pips_count: newLossPipsCount,
            loss_holding_count: newLossHoldingCount,
            updated_at: new Date().toISOString()
          };
        }
      }

      // Upsert the metric record
      const { error: upsertError } = await supabase
        .from('user_performance_metrics')
        .upsert({
          user_id: trade.user_id,
          period_type: typedPeriodType,
          period_value: cleanedPeriodValue,
          ...updatedMetric
        }, {
          onConflict: 'user_id,period_type,period_value'
        });

      if (upsertError) {
        throw new Error(`Error upserting metric for ${periodType}: ${upsertError.message}`);
      }
    });

    // Wait for all period updates to complete
    await Promise.all(updatePromises);

  } catch (error) {
    console.error('Error updating user performance metrics:', error);
    throw error;
  }
}

/**
 * Update performance metrics for an existing trade (replaces old values instead of incrementing)
 * This function should be used when updating an existing trade, not for new trades
 * @param oldTrade - The original trade data before the update
 * @param newTrade - The updated trade data
 * @returns Promise<void>
 */
export async function updateExistingTradePerformanceMetrics(oldTrade: TradeInput, newTrade: TradeInput): Promise<void> {
  try {
    console.log('Updating existing trade performance metrics:', {
      oldTrade: {
        profit_loss: oldTrade.profit_loss,
        pips: oldTrade.pips,
        exit_time: oldTrade.exit_time
      },
      newTrade: {
        profit_loss: newTrade.profit_loss,
        pips: newTrade.pips,
        exit_time: newTrade.exit_time
      }
    });
    
    // First, remove the old trade's contribution
    await removeTradeFromPerformanceMetrics(oldTrade);
    
    // Then, add the new trade's contribution
    await updateUserPerformanceMetrics(newTrade);
    
    console.log('Successfully updated existing trade performance metrics');
  } catch (error) {
    console.error('Error updating existing trade performance metrics:', error);
    throw error;
  }
}

/**
 * Batch update user performance metrics for multiple trades
 * @param trades - Array of trade objects
 * @returns Promise<void>
 */
export async function updateUserPerformanceMetricsBatch(trades: TradeInput[]): Promise<void> {
  try {
    // Process trades sequentially to maintain data consistency
    for (const trade of trades) {
      await updateUserPerformanceMetrics(trade);
    }
  } catch (error) {
    console.error('Error in batch update of user performance metrics:', error);
    throw error;
  }
}

/**
 * Remove trade from user performance metrics (for trade deletions)
 * @param trade - The trade object to remove from metrics
 * @returns Promise<void>
 */
export async function removeTradeFromPerformanceMetrics(trade: TradeInput): Promise<void> {
  try {
    // Extract period values from exit_time
    const periodValues = extractPeriodValues(trade.exit_time);
    
    // Determine if this was a win or loss
    const isWin = trade.profit_loss >= 0;
    
    // Debug logging
    console.log('Removing trade from performance metrics:', {
      trade_id: trade.user_id,
      profit_loss: trade.profit_loss,
      pips: trade.pips,
      isWin,
      exit_time: trade.exit_time
    });
    
    // Process each period type
    const updatePromises = Object.entries(periodValues).map(async ([periodType, periodValue]) => {
      const typedPeriodType = periodType as PeriodType;
      const cleanedPeriodValue = cleanPeriodValue(periodValue);
      
      // Get existing metric record
      let existingMetric = null;
      let fetchError = null;
      
      try {
        const result = await supabase
          .from('user_performance_metrics')
          .select('*')
          .eq('user_id', trade.user_id)
          .eq('period_type', typedPeriodType)
          .eq('period_value', cleanedPeriodValue)
          .maybeSingle();
        
        existingMetric = result.data;
        fetchError = result.error;
      } catch (error: any) {
        console.warn(`Error fetching existing metric for ${periodType}: ${error.message}`);
        // Continue without throwing error
        return;
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn(`Error fetching existing metric for ${periodType}: ${fetchError.message}`);
        // Continue without throwing error
        return;
      }

      if (!existingMetric) {
        // No metric record exists, nothing to remove
        console.log(`No existing metric found for ${periodType}: ${cleanedPeriodValue}`);
        return;
      }

      let updatedMetric: Partial<UserPerformanceMetric>;

      if (isWin) {
        // Remove win-related metrics
        const currentWinProfit = Number(existingMetric.win_profit || 0);
        const currentWinPips = Number(existingMetric.win_pips || 0);
        const tradeProfit = Math.abs(Number(trade.profit_loss));
        const tradePips = Math.abs(Number(trade.pips));
        
        const newWinCount = Math.max(0, (existingMetric.win_count || 0) - 1);
        const newWinProfit = Math.max(0, currentWinProfit - tradeProfit);
        const newWinPips = Math.max(0, currentWinPips - tradePips);
        const newWinHoldingTime = Math.max(0, (existingMetric.win_holding_time || 0) - trade.hold_time);
        const newWinPipsCount = Math.max(0, (existingMetric.win_pips_count || 0) - (tradePips > 0 ? 1 : 0));
        const newWinHoldingCount = Math.max(0, (existingMetric.win_holding_count || 0) - (trade.entry_time && trade.exit_time ? 1 : 0));
        
        console.log(`Removing win trade from ${periodType}:`, {
          currentWinProfit,
          tradeProfit,
          newWinProfit,
          currentWinPips,
          tradePips,
          newWinPips
        });
        
        updatedMetric = {
          win_count: newWinCount,
          win_profit: newWinProfit,
          win_pips: newWinPips,
          win_holding_time: newWinHoldingTime,
          win_pips_count: newWinPipsCount,
          win_holding_count: newWinHoldingCount,
          updated_at: new Date().toISOString()
        };
      } else {
        // Remove loss-related metrics
        const currentLossLoss = Number(existingMetric.loss_loss || 0);
        const currentLossPips = Number(existingMetric.loss_pips || 0);
        const tradeLoss = Math.abs(Number(trade.profit_loss));
        const tradePips = Math.abs(Number(trade.pips));
        
        const newLossCount = Math.max(0, (existingMetric.loss_count || 0) - 1);
        const newLossLoss = Math.min(0, currentLossLoss + tradeLoss);
        const newLossPips = Math.min(0, currentLossPips + tradePips);
        const newLossHoldingTime = Math.max(0, (existingMetric.loss_holding_time || 0) - trade.hold_time);
        const newLossPipsCount = Math.max(0, (existingMetric.loss_pips_count || 0) - (tradePips > 0 ? 1 : 0));
        const newLossHoldingCount = Math.max(0, (existingMetric.loss_holding_count || 0) - (trade.entry_time && trade.exit_time ? 1 : 0));

        console.log(`Removing loss trade from ${periodType}:`, {
          currentLossLoss,
          tradeLoss,
          newLossLoss,
          currentLossPips,
          tradePips,
          newLossPips
        });

        updatedMetric = {
          loss_count: newLossCount,
          loss_loss: newLossLoss,
          loss_pips: newLossPips,
          loss_holding_time: newLossHoldingTime,
          loss_pips_count: newLossPipsCount,
          loss_holding_count: newLossHoldingCount,
          updated_at: new Date().toISOString()
        };
      }

      // Update the metric record
      const { error: updateError } = await supabase
        .from('user_performance_metrics')
        .update(updatedMetric)
        .eq('user_id', trade.user_id)
        .eq('period_type', typedPeriodType)
        .eq('period_value', cleanedPeriodValue);

      if (updateError) {
        throw new Error(`Error updating metric for ${periodType}: ${updateError.message}`);
      }
    });

    // Wait for all period updates to complete
    await Promise.all(updatePromises);

  } catch (error) {
    console.error('Error removing trade from performance metrics:', error);
    throw error;
  }
}