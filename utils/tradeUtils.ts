import { supabase } from "@/lib/supabaseClient";
import { localDateTimeToUTC } from "./timeUtils";
import { updateUserPerformanceMetrics, TradeInput } from "./metrics/updateUserPerformanceMetrics";

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
            entry_time: (() => {
              const result = localDateTimeToUTC(tradeData.entryTime || "");
              console.log("Update - Entry time conversion:", { input: tradeData.entryTime, output: result });
              return result;
            })(),
            exit_time: (() => {
              const result = localDateTimeToUTC(tradeData.exitTime || "");
              console.log("Update - Exit time conversion:", { input: tradeData.exitTime, output: result });
              return result;
            })(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTrade.id)
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        // Update tags
        if (tradeData.tags) {
          // Delete existing tags
          await supabase
            .from("trade_tag_links")
            .delete()
            .eq("trade_id", editingTrade.id);
          
          // Add new tags
          for (const tagName of tradeData.tags) {
            // Get or create tag
            let { data: tagData, error: tagError } = await supabase
              .from("trade_tags")
              .select("id")
              .eq("tag_name", tagName)
              .eq("user_id", user.id)
              .single();
            
            let tagId = null;
            if (tagError && tagError.code === 'PGRST116') {
              // Tag doesn't exist, create it
              const { data: newTag, error: createTagError } = await supabase
                .from("trade_tags")
                .insert([{ tag_name: tagName, user_id: user.id }])
                .select()
                .single();
              
              if (createTagError) {
                console.error("Error creating tag:", createTagError);
                continue;
              }
              tagId = newTag.id;
            } else if (tagError) {
              console.error("Error finding tag:", tagError);
              continue;
            } else if (tagData) {
              tagId = tagData.id;
            }
            
            // Create link
            await supabase
              .from("trade_tag_links")
              .insert([{ trade_id: editingTrade.id, tag_id: tagId }]);
          }
        }
        
        // Update emotions
        if (tradeData.emotion) {
          // Delete existing emotions
          await supabase
            .from("trade_emotion_links")
            .delete()
            .eq("trade_id", editingTrade.id);
          
          // Add new emotions
          for (const emotionName of tradeData.emotion) {
            // Get or create emotion
            let { data: emotionData, error: emotionError } = await supabase
              .from("emotions")
              .select("id")
              .eq("emotion", emotionName)
              .eq("user_id", user.id)
              .single();
            
            let emotionId = null;
            if (emotionError && emotionError.code === 'PGRST116') {
              // Emotion doesn't exist, create it
              const { data: newEmotion, error: createEmotionError } = await supabase
                .from("emotions")
                .insert([{ emotion: emotionName, user_id: user.id }])
                .select()
                .single();
              
              if (createEmotionError) {
                console.error("Error creating emotion:", createEmotionError);
                continue;
              }
              emotionId = newEmotion.id;
            } else if (emotionError) {
              console.error("Error finding emotion:", emotionError);
              continue;
            } else if (emotionData) {
              emotionId = emotionData.id;
            }
            
            if (emotionId) {
              // Create link
              await supabase
                .from("trade_emotion_links")
                .insert([{ trade_id: editingTrade.id, emotion_id: emotionId }]);
            }
          }
        }
        
        // Update performance metrics for the updated trade
        const tradeInput: TradeInput = {
          user_id: user.id,
          exit_time: localDateTimeToUTC(tradeData.exitTime || ""),
          profit_loss: tradeData.profit || 0,
          pips: tradeData.pips || 0,
          hold_time: tradeData.holdingTime || 0,
          trade_type: tradeData.type === "買い" ? 0 : 1,
          entry_time: localDateTimeToUTC(tradeData.entryTime || ""),
        };

        try {
          await updateUserPerformanceMetrics(tradeInput);
        } catch (metricsError) {
          console.error("Error updating performance metrics after trade update:", metricsError);
          // Don't fail the update if metrics update fails
        }
        
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
            entry_time: (() => {
              const result = localDateTimeToUTC(tradeData.entryTime || "");
              console.log("Insert - Entry time conversion:", { input: tradeData.entryTime, output: result });
              return result;
            })(),
            exit_time: (() => {
              const result = localDateTimeToUTC(tradeData.exitTime || "");
              console.log("Insert - Exit time conversion:", { input: tradeData.exitTime, output: result });
              return result;
            })(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
          const newTradeId = data[0].id;
          
          // Add tags
          if (tradeData.tags) {
            for (const tagName of tradeData.tags) {
              // Get or create tag
              let { data: tagData, error: tagError } = await supabase
                .from("trade_tags")
                .select("id")
                .eq("tag_name", tagName)
                .eq("user_id", user.id)
                .single();
              
              let tagId = null;
              if (tagError && tagError.code === 'PGRST116') {
                // Tag doesn't exist, create it
                const { data: newTag, error: createTagError } = await supabase
                  .from("trade_tags")
                  .insert([{ tag_name: tagName, user_id: user.id }])
                  .select()
                  .single();
                
                if (createTagError) {
                  console.error("Error creating tag:", createTagError);
                  continue;
                }
                tagId = newTag.id;
              } else if (tagError) {
                console.error("Error finding tag:", tagError);
                continue;
              } else if (tagData) {
                tagId = tagData.id;
              }
              
              // Create link
              await supabase
                .from("trade_tag_links")
                .insert([{ trade_id: newTradeId, tag_id: tagId }]);
            }
          }
          
          // Add emotions
          if (tradeData.emotion) {
            for (const emotionName of tradeData.emotion) {
              // Get or create emotion
              let { data: emotionData, error: emotionError } = await supabase
                .from("emotions")
                .select("id")
                .eq("emotion", emotionName)
                .eq("user_id", user.id)
                .single();
              
              let emotionId = null;
              if (emotionError && emotionError.code === 'PGRST116') {
                // Emotion doesn't exist, create it
                const { data: newEmotion, error: createEmotionError } = await supabase
                  .from("emotions")
                  .insert([{ emotion: emotionName, user_id: user.id }])
                  .select()
                  .single();
                
                if (createEmotionError) {
                  console.error("Error creating emotion:", createEmotionError);
                  continue;
                }
                emotionId = newEmotion.id;
              } else if (emotionError) {
                console.error("Error finding emotion:", emotionError);
                continue;
              } else if (emotionData) {
                emotionId = emotionData.id;
              }
              
              if (emotionId) {
                // Create link
                await supabase
                  .from("trade_emotion_links")
                  .insert([{ trade_id: newTradeId, emotion_id: emotionId }]);
              }
            }
          }

          // Update performance metrics for the new trade
          const tradeInput: TradeInput = {
            user_id: user.id,
            exit_time: localDateTimeToUTC(tradeData.exitTime || ""),
            profit_loss: tradeData.profit || 0,
            pips: tradeData.pips || 0,
            hold_time: tradeData.holdingTime || 0,
            trade_type: tradeData.type === "買い" ? 0 : 1,
            entry_time: localDateTimeToUTC(tradeData.entryTime || ""),
          };

          try {
            await updateUserPerformanceMetrics(tradeInput);
          } catch (metricsError) {
            console.error("Error updating performance metrics after trade insertion:", metricsError);
            // Don't fail the insertion if metrics update fails
          }
          
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