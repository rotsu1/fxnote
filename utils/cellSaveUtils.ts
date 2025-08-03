import { Trade } from "./types"
import { localDateTimeToUTC } from "./timeUtils"
import { validateCellValue, mapFieldToDatabase } from "./tableUtils"
import { supabase } from "@/lib/supabaseClient"
import { updateUserPerformanceMetrics, updateExistingTradePerformanceMetrics, TradeInput } from "./metrics/updateUserPerformanceMetrics";

export interface CellSaveResult {
  success: boolean
  error?: string
  displayValue?: any
}

export interface CellSaveOptions {
  id: number
  field: keyof Trade
  value: any
  originalValue: any
  user: any
}

/**
 * Handles saving a cell value to the database
 */
export const saveCellValue = async (options: CellSaveOptions): Promise<CellSaveResult> => {
  const { id, field, value, originalValue, user } = options
  
  console.log('saveCellValue called:', { id, field, value })
  
  if (value === undefined) {
    console.log('Value is undefined, returning early')
    return { success: false, error: 'Value is undefined' }
  }
  
  // Convert datetime-local format back to ISO string for datetime fields
  let processedValue = value
  if (field === 'entryTime' || field === 'exitTime') {
    processedValue = localDateTimeToUTC(value as string)
  }
  
  // Validate the value
  const validation = validateCellValue(field, processedValue)
  if (!validation.isValid) {
    return { success: false, error: validation.error! }
  }
  
  // Check if value actually changed
  let valuesEqual = false
  if (Array.isArray(processedValue) && Array.isArray(originalValue)) {
    valuesEqual = processedValue.length === originalValue.length && 
                 processedValue.every((item, index) => item === originalValue[index])
  } else {
    valuesEqual = processedValue === originalValue
  }
  
  console.log('Value comparison:', { processedValue, originalValue, valuesEqual })
  
  if (valuesEqual) {
    console.log('No changes detected')
    return { success: true }
  }
  
  console.log('Starting database save for field:', field)
  
  try {
    // Handle special cases that need complex updates
    if (field === 'tags' || field === 'emotion') {
      console.log('Calling handleSpecialFieldUpdate for:', field, 'with value:', processedValue)
      await handleSpecialFieldUpdate(id, field, processedValue, user)
      return { success: true, displayValue: value }
    } else if (field === 'pair') {
      await handleSymbolUpdate(id, processedValue, user)
      return { success: true, displayValue: value }
    } else {
      // Handle regular field updates
      const { field: dbField, value: dbValue } = mapFieldToDatabase(field, processedValue)
      
      // Update performance metrics if the field affects metrics
      if (field === 'profit' || field === 'pips' || field === 'exitTime' || field === 'entryTime') {
        try {
          // First, get the original trade data before the update
          const { data: originalTradeData, error: originalFetchError } = await supabase
            .from("trades")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();
          
          if (!originalFetchError && originalTradeData) {
            // Create the old trade input
            const oldTradeInput: TradeInput = {
              user_id: originalTradeData.user_id,
              exit_time: originalTradeData.exit_time,
              profit_loss: originalTradeData.profit_loss,
              pips: originalTradeData.pips,
              hold_time: originalTradeData.hold_time || 0,
              trade_type: originalTradeData.trade_type,
              entry_time: originalTradeData.entry_time,
            };
            
            // Create the new trade input with the updated value
            const newTradeInput: TradeInput = {
              user_id: originalTradeData.user_id,
              exit_time: field === 'exitTime' ? processedValue : originalTradeData.exit_time,
              profit_loss: field === 'profit' ? processedValue : originalTradeData.profit_loss,
              pips: field === 'pips' ? processedValue : originalTradeData.pips,
              hold_time: originalTradeData.hold_time || 0,
              trade_type: originalTradeData.trade_type,
              entry_time: field === 'entryTime' ? processedValue : originalTradeData.entry_time,
            };
            
            // Update the trade in the database first
            const { error: updateError } = await supabase
              .from("trades")
              .update({ [dbField]: dbValue, updated_at: new Date().toISOString() })
              .eq("id", id)
              .eq("user_id", user.id)
            
            if (updateError) throw updateError;
            
            // Then update performance metrics
            await updateExistingTradePerformanceMetrics(oldTradeInput, newTradeInput);
          }
        } catch (metricsError) {
          console.error("Error updating performance metrics after cell update:", metricsError);
          // Don't fail the cell update if metrics update fails
        }
      } else {
        // For non-metrics fields, just update the database
        const { error } = await supabase
          .from("trades")
          .update({ [dbField]: dbValue, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id)
        
        if (error) throw error;
      }
    }
    
    // Convert back to display format for datetime fields
    let displayValue = processedValue
    if (field === 'entryTime' || field === 'exitTime') {
      // Format the datetime for display
      const date = new Date(processedValue as string)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      displayValue = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } else if (field === 'profit' || field === 'pips') {
      // For profit and pips, store the numeric value so getColumnValue can format it
      displayValue = Number(processedValue)
    }
    
    return { success: true, displayValue }
    
  } catch (error: any) {
    console.error("Error updating cell:", error)
    return { success: false, error: error.message || '更新に失敗しました' }
  }
}

/**
 * Handles special field updates for tags and emotions
 */
const handleSpecialFieldUpdate = async (id: number, field: keyof Trade, value: any, user: any) => {
  console.log('handleSpecialFieldUpdate called:', { id, field, value })
  
  if (field === 'tags') {
    // Delete existing tags
    await supabase
      .from("trade_tag_links")
      .delete()
      .eq("trade_id", id)
    
    // Add new tags
    if (Array.isArray(value) && value.length > 0) {
      for (const tagName of value) {
        // Get or create tag
        let { data: tagData, error: tagError } = await supabase
          .from("trade_tags")
          .select("id")
          .eq("tag_name", tagName)
          .eq("user_id", user.id)
          .single()
        
        let tagId = null
        if (tagError && tagError.code === 'PGRST116') {
          // Tag doesn't exist, create it
          const { data: newTag, error: createTagError } = await supabase
            .from("trade_tags")
            .insert([{ tag_name: tagName, user_id: user.id }])
            .select()
            .single()
          
          if (createTagError) {
            console.error("Error creating tag:", createTagError)
            continue
          }
          tagId = newTag.id
        } else if (tagError) {
          console.error("Error finding tag:", tagError)
          continue
        } else if (tagData) {
          tagId = tagData.id
        }
        
        // Create link
        await supabase
          .from("trade_tag_links")
          .insert([{ trade_id: id, tag_id: tagId }])
      }
    }
  } else if (field === 'emotion') {
    console.log('Processing emotion field with value:', value)
    
    // Delete existing emotions
    console.log('Deleting existing emotion links for trade_id:', id)
    const { error: deleteError } = await supabase
      .from("trade_emotion_links")
      .delete()
      .eq("trade_id", id)
    
    if (deleteError) {
      console.error('Error deleting existing emotions:', deleteError)
      throw deleteError
    }
    console.log('Successfully deleted existing emotion links')
    
    // Add new emotions
    if (Array.isArray(value) && value.length > 0) {
      console.log('Adding new emotions:', value)
      for (const emotionName of value) {
        console.log('Processing emotion:', emotionName)
        
        // Get or create emotion
        let { data: emotionData, error: emotionError } = await supabase
          .from("emotions")
          .select("id")
          .eq("emotion", emotionName)
          .eq("user_id", user.id)
          .single()
        
        let emotionId = null
        if (emotionError && emotionError.code === 'PGRST116') {
          console.log('Emotion not found, creating new emotion:', emotionName)
          // Emotion doesn't exist, create it
          const { data: newEmotion, error: createEmotionError } = await supabase
            .from("emotions")
            .insert([{ emotion: emotionName, user_id: user.id }])
            .select()
            .single()
          
          if (createEmotionError) {
            console.error("Error creating emotion:", createEmotionError)
            continue
          }
          emotionId = newEmotion.id
          console.log('Created new emotion with ID:', emotionId)
        } else if (emotionError) {
          console.error("Error finding emotion:", emotionError)
          continue
        } else if (emotionData) {
          emotionId = emotionData.id
          console.log('Found existing emotion with ID:', emotionId)
        }
        
        if (emotionId) {
          console.log('Creating emotion link for trade_id:', id, 'emotion_id:', emotionId)
          // Create link
          const { error: linkError } = await supabase
            .from("trade_emotion_links")
            .insert([{ trade_id: id, emotion_id: emotionId }])
          
          if (linkError) {
            console.error('Error creating emotion link:', linkError)
            throw linkError
          }
          console.log('Successfully created emotion link')
        }
      }
    }
  }
}

/**
 * Handles symbol updates
 */
const handleSymbolUpdate = async (id: number, symbolName: string, user: any) => {
  // Get or create symbol ID
  let symbolId = null
  if (symbolName) {
    // First try to find existing symbol
    let { data: symbolData, error: symbolError } = await supabase
      .from("symbols")
      .select("id")
      .eq("symbol", symbolName)
      .single()
    
    if (symbolError && symbolError.code === 'PGRST116') {
      // Symbol doesn't exist, create it
      const { data: newSymbol, error: createError } = await supabase
        .from("symbols")
        .insert([{ symbol: symbolName }])
        .select()
        .single()
      
      if (createError) {
        console.error("Error creating symbol:", createError)
        throw createError
      }
      symbolId = newSymbol.id
    } else if (symbolError) {
      console.error("Error finding symbol:", symbolError)
      throw symbolError
    } else if (symbolData) {
      symbolId = symbolData.id
    }
  }

  // Update trade with new symbol
  const { error } = await supabase
    .from("trades")
    .update({ 
      symbol: symbolId, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .eq("user_id", user.id)
  
  if (error) throw error
} 