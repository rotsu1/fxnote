import { Trade } from "./types"
import { utcToLocalDateTime } from "./timeUtils"

export interface CellEditingState {
  editingCell: { id: number; field: keyof Trade } | null
  editingValues: Record<string, any>
  savingCells: Set<string>
  cellErrors: Record<string, string>
  originalValues: Record<string, any>
}

export interface CellClickResult {
  shouldOpenDialog: boolean
  newEditingState: Partial<CellEditingState>
}

/**
 * Handles cell click logic and returns whether to open edit dialog and new editing state
 */
export const handleCellClickLogic = (
  id: number,
  field: keyof Trade,
  trade: Trade,
  currentEditingState: CellEditingState
): CellClickResult => {
  const cellKey = `${id}-${field}`
  
  // Don't allow editing if the cell is currently being saved
  if (currentEditingState.savingCells.has(cellKey)) {
    return { shouldOpenDialog: false, newEditingState: {} }
  }
  
  // Don't allow editing of complex fields that need special handling
  if (field === 'date' || field === 'time') {
    // For these fields, open the edit dialog instead
    return { shouldOpenDialog: true, newEditingState: {} }
  }
  
  // Store original value for potential rollback
  const newOriginalValues = {
    ...currentEditingState.originalValues,
    [cellKey]: trade[field]
  }
  
  // Initialize editing value - convert datetime fields to datetime-local format
  let editingValue = trade[field]
  if (field === 'entryTime' || field === 'exitTime') {
    editingValue = utcToLocalDateTime(trade[field] as string)
  }
  
  let newEditingValues = { ...currentEditingState.editingValues }
  
  // Initialize holding time fields
  if (field === 'holdingTime') {
    const totalSeconds = typeof trade[field] === 'number' ? trade[field] as number : 0
    const days = Math.floor(totalSeconds / (24 * 60 * 60))
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
    const seconds = totalSeconds % 60
    
    newEditingValues = {
      ...newEditingValues,
      [`${id}-holdingDays`]: days || "",
      [`${id}-holdingHours`]: hours || "",
      [`${id}-holdingMinutes`]: minutes || "",
      [`${id}-holdingSeconds`]: seconds || "",
      [cellKey]: totalSeconds
    }
  } else {
    newEditingValues = {
      ...newEditingValues,
      [cellKey]: editingValue
    }
  }
  
  // Clear any previous errors for this cell
  const newCellErrors = {
    ...currentEditingState.cellErrors,
    [cellKey]: ""
  }
  
  const newEditingState: Partial<CellEditingState> = {
    editingCell: { id, field },
    editingValues: newEditingValues,
    originalValues: newOriginalValues,
    cellErrors: newCellErrors
  }
  
  return { shouldOpenDialog: false, newEditingState }
}

/**
 * Handles cell change logic for holding time fields
 */
export const handleHoldingTimeChange = (
  id: number,
  field: keyof Trade,
  value: any,
  currentEditingState: CellEditingState
): Partial<CellEditingState> => {
  if (field !== 'holdingTime') {
    return {
      editingValues: {
        ...currentEditingState.editingValues,
        [`${id}-${field}`]: value
      }
    }
  }
  
  const totalSeconds = value
  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60
  
  return {
    editingValues: {
      ...currentEditingState.editingValues,
      [`${id}-holdingDays`]: days || "",
      [`${id}-holdingHours`]: hours || "",
      [`${id}-holdingMinutes`]: minutes || "",
      [`${id}-holdingSeconds`]: seconds || "",
      [`${id}-${field}`]: value
    }
  }
}

/**
 * Handles cell escape logic to restore original values
 */
export const handleCellEscape = (
  id: number,
  field: keyof Trade,
  currentEditingState: CellEditingState
): Partial<CellEditingState> => {
  const cellKey = `${id}-${field}`
  let originalValue = currentEditingState.originalValues[cellKey]
  
  // Convert datetime fields back to datetime-local format for display
  if (field === 'entryTime' || field === 'exitTime') {
    originalValue = utcToLocalDateTime(originalValue as string)
  }
  
  let newEditingValues = { ...currentEditingState.editingValues }
  
  // For holding time, restore individual fields
  if (field === 'holdingTime') {
    const totalSeconds = originalValue as number || 0
    const days = Math.floor(totalSeconds / (24 * 60 * 60))
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
    const seconds = totalSeconds % 60
    
    newEditingValues = {
      ...newEditingValues,
      [`${id}-holdingDays`]: days || "",
      [`${id}-holdingHours`]: hours || "",
      [`${id}-holdingMinutes`]: minutes || "",
      [`${id}-holdingSeconds`]: seconds || "",
      [cellKey]: originalValue
    }
  } else {
    newEditingValues = {
      ...newEditingValues,
      [cellKey]: originalValue
    }
  }
  
  return {
    editingCell: null,
    editingValues: newEditingValues,
    cellErrors: {
      ...currentEditingState.cellErrors,
      [cellKey]: ""
    }
  }
} 