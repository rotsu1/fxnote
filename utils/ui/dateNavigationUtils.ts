/**
 * Handles previous day navigation
 */
export const handlePreviousDay = (selectedDate: Date | undefined): Date | undefined => {
  if (!selectedDate) return undefined
  
  const previousDay = new Date(selectedDate)
  previousDay.setDate(previousDay.getDate() - 1)
  return previousDay
}

/**
 * Handles next day navigation
 */
export const handleNextDay = (selectedDate: Date | undefined): Date | undefined => {
  if (!selectedDate) return undefined
  
  const nextDay = new Date(selectedDate)
  nextDay.setDate(nextDay.getDate() + 1)
  return nextDay
} 