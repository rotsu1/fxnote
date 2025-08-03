import { supabase } from "@/lib/supabaseClient"

export interface ColumnManagementState {
  visibleColumns: string[]
  draggedColumn: string | null
  hasUnsavedChanges: boolean
}

export interface ColumnToggleResult {
  visibleColumns: string[]
  hasUnsavedChanges: boolean
}

export interface ColumnDragResult {
  visibleColumns: string[]
  draggedColumn: string | null
  hasUnsavedChanges: boolean
}

/**
 * Handles column toggle logic
 */
export const handleColumnToggle = (
  columnId: string,
  isVisible: boolean,
  currentState: ColumnManagementState
): ColumnToggleResult => {
  const visibleColumns = isVisible 
    ? [...currentState.visibleColumns, columnId] 
    : currentState.visibleColumns.filter((id) => id !== columnId)
  
  return {
    visibleColumns,
    hasUnsavedChanges: true
  }
}

/**
 * Handles column drag start logic
 */
export const handleColumnDragStart = (
  columnId: string,
  currentState: ColumnManagementState
): ColumnManagementState => {
  return {
    ...currentState,
    draggedColumn: columnId
  }
}

/**
 * Handles column drop logic
 */
export const handleColumnDrop = (
  targetColumnId: string,
  currentState: ColumnManagementState
): ColumnDragResult => {
  if (!currentState.draggedColumn || currentState.draggedColumn === targetColumnId) {
    return {
      visibleColumns: currentState.visibleColumns,
      draggedColumn: null,
      hasUnsavedChanges: currentState.hasUnsavedChanges
    }
  }

  const newOrder = [...currentState.visibleColumns]
  const draggedIndex = newOrder.indexOf(currentState.draggedColumn)
  const targetIndex = newOrder.indexOf(targetColumnId)

  // Remove dragged item from its current position
  newOrder.splice(draggedIndex, 1)
  // Insert it at the target position
  newOrder.splice(targetIndex, 0, currentState.draggedColumn)

  return {
    visibleColumns: newOrder,
    draggedColumn: null,
    hasUnsavedChanges: true
  }
}

/**
 * Saves column preferences to database
 */
export const saveColumnPreferences = async (
  visibleColumns: string[],
  user: any,
  allColumns: any[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    const columnMapping = {
      'pair': 'symbol',
      'entryTime': 'entry_time',
      'exitTime': 'exit_time',
      'type': 'type',
      'lot': 'lot',
      'entry': 'entry_price',
      'exit': 'exit_price',
      'pips': 'pips',
      'profit': 'profit_loss',
      'emotion': 'emotion',
      'holdingTime': 'hold_time',
      'notes': 'note',
      'tags': 'tag',
    }

    const preferences: any = {}
    
    // Set order for visible columns (1-based indexing to match database)
    visibleColumns.forEach((columnId, index) => {
      const dbField = columnMapping[columnId as keyof typeof columnMapping]
      if (dbField) {
        preferences[dbField] = index + 1 // Convert 0-based to 1-based
      }
    })

    // Set null for hidden columns
    allColumns.forEach((column) => {
      const dbField = columnMapping[column.id as keyof typeof columnMapping]
      if (dbField && !visibleColumns.includes(column.id)) {
        preferences[dbField] = null
      }
    })

    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from("table_column_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existingPrefs) {
      // Update existing preferences
      await supabase
        .from("table_column_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
    } else {
      // Create new preferences
      await supabase
        .from("table_column_preferences")
        .insert([{
          user_id: user.id,
          ...preferences,
        }])
    }
    
    return { success: true }
  } catch (error: any) {
    console.error("Error saving column preferences:", error)
    return { success: false, error: error.message }
  }
} 