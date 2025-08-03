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
  period_type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'total';
  period_value: string;
  win_count: number;
  loss_count: number;
  win_profit: number;
  loss_loss: number;
  win_pips: number;
  loss_pips: number;
  avg_win_holding_time: number;
  avg_loss_holding_time: number;
  max_win_streak: number;
  max_loss_streak: number;
  created_at?: string;
  updated_at?: string;
}

// Period type definition
type PeriodType = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'total';

/**
 * Extracts period values from exit_time for different time resolutions
 */
function extractPeriodValues(exitTime: string | Date): Record<PeriodType, string> {
  const date = new Date(exitTime);
  
  // Ensure the date is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid exit_time provided');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');

  // Get ISO week number
  const getISOWeek = (date: Date): number => {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };

  const weekNumber = getISOWeek(date);

  return {
    hourly: `${year}-${month}-${day}T${hour}`,
    daily: `${year}-${month}-${day}`,
    weekly: `${year}-W${String(weekNumber).padStart(2, '0')}`,
    monthly: `${year}-${month}`,
    yearly: `${year}`,
    total: 'total'
  };
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
    
    // Determine if this is a win or loss
    const isWin = trade.profit_loss >= 0;
    
    // Process each period type
    const updatePromises = Object.entries(periodValues).map(async ([periodType, periodValue]) => {
      const typedPeriodType = periodType as PeriodType;
      
      // Get existing metric record
      const { data: existingMetric, error: fetchError } = await supabase
        .from('user_performance_metrics')
        .select('*')
        .eq('user_id', trade.user_id)
        .eq('period_type', typedPeriodType)
        .eq('period_value', periodValue)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new Error(`Error fetching existing metric: ${fetchError.message}`);
      }

      let updatedMetric: Partial<UserPerformanceMetric>;

      if (!existingMetric) {
        // Create new record with initial values
        updatedMetric = {
          user_id: trade.user_id,
          period_type: typedPeriodType,
          period_value: periodValue,
          win_count: isWin ? 1 : 0,
          loss_count: isWin ? 0 : 1,
          win_profit: isWin ? trade.profit_loss : 0,
          loss_loss: isWin ? 0 : Math.abs(trade.profit_loss), // Store loss as positive value
          win_pips: isWin ? trade.pips : 0,
          loss_pips: isWin ? 0 : Math.abs(trade.pips), // Store loss pips as positive value
          avg_win_holding_time: isWin ? trade.hold_time : 0,
          avg_loss_holding_time: isWin ? 0 : trade.hold_time,
          max_win_streak: isWin ? 1 : 0,
          max_loss_streak: isWin ? 0 : 1,
          updated_at: new Date().toISOString()
        };
      } else {
        // Update existing record
        const currentWinCount = existingMetric.win_count || 0;
        const currentLossCount = existingMetric.loss_count || 0;
        const currentWinProfit = existingMetric.win_profit || 0;
        const currentLossLoss = existingMetric.loss_loss || 0;
        const currentWinPips = existingMetric.win_pips || 0;
        const currentLossPips = existingMetric.loss_pips || 0;
        const currentAvgWinHoldingTime = existingMetric.avg_win_holding_time || 0;
        const currentAvgLossHoldingTime = existingMetric.avg_loss_holding_time || 0;
        const currentMaxWinStreak = existingMetric.max_win_streak || 0;
        const currentMaxLossStreak = existingMetric.max_loss_streak || 0;

        if (isWin) {
          // Update win-related metrics
          const newWinCount = currentWinCount + 1;
          const newWinProfit = currentWinProfit + trade.profit_loss;
          const newWinPips = currentWinPips + trade.pips;
          
          // Update average win holding time using incremental average formula
          const newAvgWinHoldingTime = currentWinCount === 0 
            ? trade.hold_time 
            : (currentAvgWinHoldingTime * currentWinCount + trade.hold_time) / newWinCount;

          updatedMetric = {
            win_count: newWinCount,
            win_profit: newWinProfit,
            win_pips: newWinPips,
            avg_win_holding_time: newAvgWinHoldingTime,
            max_win_streak: currentMaxWinStreak + 1, // Increment win streak
            max_loss_streak: 0, // Reset loss streak
            updated_at: new Date().toISOString()
          };
        } else {
          // Update loss-related metrics
          const newLossCount = currentLossCount + 1;
          const newLossLoss = currentLossLoss + Math.abs(trade.profit_loss);
          const newLossPips = currentLossPips + Math.abs(trade.pips);
          
          // Update average loss holding time using incremental average formula
          const newAvgLossHoldingTime = currentLossCount === 0 
            ? trade.hold_time 
            : (currentAvgLossHoldingTime * currentLossCount + trade.hold_time) / newLossCount;

          updatedMetric = {
            loss_count: newLossCount,
            loss_loss: newLossLoss,
            loss_pips: newLossPips,
            avg_loss_holding_time: newAvgLossHoldingTime,
            max_loss_streak: currentMaxLossStreak + 1, // Increment loss streak
            max_win_streak: 0, // Reset win streak
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
          period_value: periodValue,
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
    
    // Process each period type
    const updatePromises = Object.entries(periodValues).map(async ([periodType, periodValue]) => {
      const typedPeriodType = periodType as PeriodType;
      
      // Get existing metric record
      const { data: existingMetric, error: fetchError } = await supabase
        .from('user_performance_metrics')
        .select('*')
        .eq('user_id', trade.user_id)
        .eq('period_type', typedPeriodType)
        .eq('period_value', periodValue)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Error fetching existing metric: ${fetchError.message}`);
      }

      if (!existingMetric) {
        // No metric record exists, nothing to remove
        return;
      }

      let updatedMetric: Partial<UserPerformanceMetric>;

      if (isWin) {
        // Remove win-related metrics
        const newWinCount = Math.max(0, (existingMetric.win_count || 0) - 1);
        const newWinProfit = Math.max(0, (existingMetric.win_profit || 0) - trade.profit_loss);
        const newWinPips = Math.max(0, (existingMetric.win_pips || 0) - trade.pips);
        
        // Recalculate average win holding time
        let newAvgWinHoldingTime = 0;
        if (newWinCount > 0) {
          const currentTotalTime = (existingMetric.avg_win_holding_time || 0) * (existingMetric.win_count || 0);
          newAvgWinHoldingTime = (currentTotalTime - trade.hold_time) / newWinCount;
        }

        updatedMetric = {
          win_count: newWinCount,
          win_profit: newWinProfit,
          win_pips: newWinPips,
          avg_win_holding_time: newAvgWinHoldingTime,
          updated_at: new Date().toISOString()
        };
      } else {
        // Remove loss-related metrics
        const newLossCount = Math.max(0, (existingMetric.loss_count || 0) - 1);
        const newLossLoss = Math.max(0, (existingMetric.loss_loss || 0) - Math.abs(trade.profit_loss));
        const newLossPips = Math.max(0, (existingMetric.loss_pips || 0) - Math.abs(trade.pips));
        
        // Recalculate average loss holding time
        let newAvgLossHoldingTime = 0;
        if (newLossCount > 0) {
          const currentTotalTime = (existingMetric.avg_loss_holding_time || 0) * (existingMetric.loss_count || 0);
          newAvgLossHoldingTime = (currentTotalTime - trade.hold_time) / newLossCount;
        }

        updatedMetric = {
          loss_count: newLossCount,
          loss_loss: newLossLoss,
          loss_pips: newLossPips,
          avg_loss_holding_time: newAvgLossHoldingTime,
          updated_at: new Date().toISOString()
        };
      }

      // Update the metric record
      const { error: updateError } = await supabase
        .from('user_performance_metrics')
        .update(updatedMetric)
        .eq('user_id', trade.user_id)
        .eq('period_type', typedPeriodType)
        .eq('period_value', periodValue);

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