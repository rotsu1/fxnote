import { Trade } from "./types"

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

export interface CellBlurResult {
  shouldSave: boolean
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
  
  // Initialize editing value - keep datetime-local format
  let editingValue: any = trade[field]
  if (field === 'entryTime' || field === 'exitTime') {
    if (typeof editingValue === 'string') {
      editingValue = editingValue.includes('T') ? editingValue : editingValue.replace(' ', 'T')
    }
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
  
  // Normalize datetime format back to datetime-local if needed
  if (field === 'entryTime' || field === 'exitTime') {
    if (typeof originalValue === 'string') {
      originalValue = originalValue.includes('T') ? originalValue : originalValue.replace(' ', 'T')
    }
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

/**
 * Handles cell blur logic and determines if save is needed
 */
export const handleCellBlurLogic = (
  currentEditingState: CellEditingState,
  isSaving: boolean
): CellBlurResult => {
  
  if (!currentEditingState.editingCell || isSaving) {
    return { shouldSave: false, newEditingState: {} }
  }
  
  const cellKey = `${currentEditingState.editingCell.id}-${currentEditingState.editingCell.field}`
  const currentValue = currentEditingState.editingValues[cellKey]
  const originalValue = currentEditingState.originalValues[cellKey]
  
  // Check if values are equal (handle arrays properly)
  let valuesEqual = false
  if (Array.isArray(currentValue) && Array.isArray(originalValue)) {
    valuesEqual = currentValue.length === originalValue.length && 
                 currentValue.every((item, index) => item === originalValue[index])
  } else {
    valuesEqual = currentValue === originalValue
  }
  
  // Always exit editing mode first
  const newEditingState: Partial<CellEditingState> = {
    editingCell: null,
    editingValues: {
      ...currentEditingState.editingValues,
      [cellKey]: undefined // Clear the value from editingValues
    },
    originalValues: {
      ...currentEditingState.originalValues,
      [cellKey]: undefined // Clear the value from originalValues
    }
  }
  
  // If changes were made, save them
  if (!valuesEqual) {
    return { shouldSave: true, newEditingState }
  }
  
  return { shouldSave: false, newEditingState }
} 