import { Trade } from "@/utils/core/types"
import { validateCellValue, mapFieldToDatabase } from "./tableUtils"
import { supabase } from "@/lib/supabaseClient"
import { localDateTimeToUTC } from "@/utils/ui/timeUtils"

/**
 * Translates technical database error messages to user-friendly Japanese messages
 */
function translateErrorToUserFriendly(error: any): string {
  // Check for specific error codes and messages
  if (error.code === '22P02') {
    // Invalid input syntax for type numeric
    if (error.message?.includes('numeric')) {
      return '数値以外の文字が入力されています。正しい数値を入力してください。'
    }
    return '入力された値の形式が正しくありません。'
  }
  
  if (error.code === '23514') {
    // Check constraint violation
    return '入力された値が制約条件を満たしていません。'
  }
  
  if (error.code === '23505') {
    // Unique constraint violation
    return 'この値は既に使用されています。別の値を入力してください。'
  }
  
  if (error.code === '23503') {
    // Foreign key constraint violation
    return '関連するデータが見つかりません。'
  }
  
  if (error.code === '42P01') {
    // Undefined table
    return 'テーブルが見つかりません。'
  }
  
  if (error.code === '42703') {
    // Undefined column
    return '列が見つかりません。'
  }
  
  if (error.status === 400) {
    // Bad Request - often means validation error
    return '入力された値が正しくありません。'
  }
  
  if (error.status === 401) {
    // Unauthorized
    return '認証が必要です。再度ログインしてください。'
  }
  
  if (error.status === 403) {
    // Forbidden
    return 'この操作を実行する権限がありません。'
  }
  
  if (error.status === 404) {
    // Not Found
    return 'データが見つかりません。'
  }
  
  if (error.status === 500) {
    // Internal Server Error
    return 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。'
  }
  
  // For other errors, try to provide a meaningful message
  if (error.message) {
    // Check if the message contains technical details that should be translated
    if (error.message.includes('invalid input syntax')) {
      return '入力された値の形式が正しくありません。'
    }
    if (error.message.includes('numeric')) {
      return '数値以外の文字が入力されています。'
    }
    if (error.message.includes('date')) {
      return '日付の形式が正しくありません。'
    }
    if (error.message.includes('time')) {
      return '時刻の形式が正しくありません。'
    }
  }
  
  // Default fallback message
  return '更新に失敗しました。入力された値を確認してください。'
}

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
  
  if (value === undefined) {
    return { success: false, error: 'Value is undefined' }
  }
  
  // For datetime-local fields, keep as-is (YYYY-MM-DDTHH:MM:SS) or date-only
  let processedValue = value
  
  // Convert empty values to null for specific numeric fields
  if ((field === 'lot' || field === 'entry' || field === 'exit' || field === 'pips') && 
      (processedValue === '' || processedValue === null || processedValue === undefined)) {
    processedValue = null;
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
  
  if (valuesEqual) {
    return { success: true }
  }
  
  try {
    // Handle special cases that need complex updates
    if (field === 'tags' || field === 'emotion') {
      await handleSpecialFieldUpdate(id, field, processedValue, user)
      return { success: true, displayValue: value }
    } else if (field === 'pair') {
      await handleSymbolUpdate(id, processedValue, user)
      return { success: true, displayValue: value }
    } else if (field === 'entryTime' || field === 'exitTime') {
      // Split datetime-local into date and time parts (allow date-only)
      const str = String(processedValue)
      const hasT = str.includes('T')
      const [datePartRaw, timePartRawMaybe] = hasT ? str.split('T') : [str, '']
      const datePart = datePartRaw && datePartRaw.includes('-') ? datePartRaw : ''
      const timePartRaw = (hasT ? timePartRawMaybe : '') || ''
      const timePart = timePartRaw?.length === 5 ? `${timePartRaw}:00` : (timePartRaw || null)

      // Require date; time may be null
      if (!datePart) {
        return { success: false, error: '日付を入力してください' }
      }

      // Convert to UTC date/time parts if time is provided; else set UTC time null and keep date as-is
      let utcDate = datePart
      let utcTime: string | null = null
      if (timePart) {
        const localCombined = `${datePart}T${timePart}`
        const utcIso = localDateTimeToUTC(localCombined)
        const d = new Date(utcIso)
        const yyyy = String(d.getUTCFullYear())
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
        const dd = String(d.getUTCDate()).padStart(2, '0')
        const HH = String(d.getUTCHours()).padStart(2, '0')
        const MM = String(d.getUTCMinutes()).padStart(2, '0')
        const SS = String(d.getUTCSeconds()).padStart(2, '0')
        utcDate = `${yyyy}-${mm}-${dd}`
        utcTime = `${HH}:${MM}:${SS}`
      }

      const updatePayload: Record<string, any> = field === 'entryTime'
        ? { entry_date: utcDate, entry_time: utcTime }
        : { exit_date: utcDate, exit_time: utcTime }

      const { error } = await supabase
        .from("trades")
        .update({ ...updatePayload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)
      
      if (error) throw error

      // For display: return local formatted string (date and optional time)
      const displayValue = timePart ? `${datePart} ${timePart.substring(0,8)}` : `${datePart}`
      return { success: true, displayValue }
    } else {
      // Handle regular field updates
      const { field: dbField, value: dbValue } = mapFieldToDatabase(field, processedValue)
      const { error } = await supabase
        .from("trades")
        .update({ [dbField]: dbValue, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)
      
      if (error) throw error;
    }
    
    // Convert back to display format for certain fields
    let displayValue = processedValue
    if (field === 'profit' || field === 'pips') {
      // For profit and pips, store the numeric value so getColumnValue can format it
      displayValue = Number(processedValue)
    }
    
    return { success: true, displayValue }
    
  } catch (error: any) {
    console.error("Error updating cell:", error)
    
    // Translate technical error messages to user-friendly ones
    const userFriendlyError = translateErrorToUserFriendly(error)
    return { success: false, error: userFriendlyError }
  }
}

/**
 * Handles special field updates for tags and emotions
 */
const handleSpecialFieldUpdate = async (id: number, field: keyof Trade, value: any, user: any) => {
  if (field === 'tags') {
    // Delete existing tag links (fail loudly if policy blocks it)
    const { error: deleteError } = await supabase
      .from('trade_tag_links')
      .delete()
      .eq('trade_id', id)

    if (deleteError) {
      console.error('Error deleting existing tag links:', deleteError)
      throw deleteError
    }

    // Add new tags (existing only; create if missing)
    if (Array.isArray(value) && value.length > 0) {
      for (const tagName of value) {
        // 1) Find tag for this user (use maybeSingle pattern to avoid .single() pitfalls)
        const { data: foundTags, error: findError } = await supabase
          .from('trade_tags')
          .select('id')
          .eq('tag_name', tagName)
          .eq('user_id', user.id)
          .limit(1)

        if (findError) {
          console.error('Error finding tag:', findError)
          throw findError
        }

        let tagId: number | null = (foundTags && foundTags[0]?.id) || null

        // 2) Create if not exists
        if (!tagId) {
          const { data: created, error: createError } = await supabase
            .from('trade_tags')
            .insert([{ tag_name: tagName, user_id: user.id }])
            .select('id')
            .single()

          if (createError || !created) {
            console.error('Error creating tag:', createError)
            throw createError || new Error('Failed to create tag')
          }
          tagId = created.id
        }

        // 3) Link tag to trade
        const { error: linkError } = await supabase
          .from('trade_tag_links')
          .insert([{ trade_id: id, tag_id: tagId }])

        if (linkError) {
          console.error('Error creating tag link:', linkError)
          throw linkError
        }
      }
    }
  } else if (field === 'emotion') {
    // Delete existing emotion links first
    const { error: deleteError } = await supabase
      .from('trade_emotion_links')
      .delete()
      .eq('trade_id', id)

    if (deleteError) {
      console.error('Error deleting existing emotions:', deleteError)
      throw deleteError
    }

    // Add new emotions
    if (Array.isArray(value) && value.length > 0) {
      for (const emotionName of value) {
        // Try to find existing emotion
        const { data: foundEmotions, error: findError } = await supabase
          .from('emotions')
          .select('id')
          .eq('emotion', emotionName)
          .eq('user_id', user.id)
          .limit(1)

        if (findError) {
          console.error('Error finding emotion:', findError)
          throw findError
        }

        let emotionId: number | null = (foundEmotions && foundEmotions[0]?.id) || null

        // Create if not exists
        if (!emotionId) {
          const { data: created, error: createError } = await supabase
            .from('emotions')
            .insert([{ emotion: emotionName, user_id: user.id }])
            .select('id')
            .single()

          if (createError || !created) {
            console.error('Error creating emotion:', createError)
            throw createError || new Error('Failed to create emotion')
          }
          emotionId = created.id
        }

        // Create link
        const { error: linkError } = await supabase
          .from('trade_emotion_links')
          .insert([{ trade_id: id, emotion_id: emotionId }])

        if (linkError) {
          console.error('Error creating emotion link:', linkError)
          throw linkError
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
      .eq('user_id', user.id)
      .single()
    
    if (symbolError && symbolError.code === 'PGRST116') {
      // Symbol doesn't exist, create it
      const { data: newSymbol, error: createError } = await supabase
        .from("symbols")
        .insert([{ symbol: symbolName, user_id: user.id }])
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
