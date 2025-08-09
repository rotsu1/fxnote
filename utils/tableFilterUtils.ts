import { format } from "date-fns"
import { Trade } from "./types"
import { parseTimeToMinutes } from "./timeUtils"

export interface SortConfig {
  key: keyof Trade | null
  direction: 'asc' | 'desc'
}

export interface FilterOptions {
  selectedDate: Date | undefined
  sortConfig: SortConfig
}

/**
 * Filters and sorts trades based on date and sorting configuration
 */
export const filterAndSortTrades = (
  trades: Trade[],
  options: FilterOptions
): Trade[] => {
  const { selectedDate, sortConfig } = options

  if (!selectedDate) return []

  const dateString = format(selectedDate, "yyyy-MM-dd")
  
  // Filter trades by exit date (fallback to entry date), include those without time
  let filtered = trades.filter((trade) => {
    // Prefer exitTime/date, else use date from trade.date
    const referenceDate = (() => {
      // If we have exitTime string, use it
      if (trade.exitTime) return new Date(trade.exitTime)
      // Else fall back to trade.date (already local YYYY-MM-DD string)
      if (trade.date) return new Date(`${trade.date}T00:00:00`)
      return null
    })()

    if (!referenceDate) return false
    const refDateString = referenceDate.toLocaleDateString('en-CA') // YYYY-MM-DD format
    return refDateString === dateString
  })

  // Apply sorting
  if (sortConfig.key) {
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        // For profit and pips, reverse the logic so highest values appear at top when arrow is up
        if (sortConfig.key === 'profit' || sortConfig.key === 'pips') {
          return sortConfig.direction === 'asc' ? bValue - aValue : aValue - bValue
        }
        // For other numeric fields (lot, entry, exit), use normal sorting
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Special handling for holding time (保有時間)
        if (sortConfig.key === 'holdingTime') {
          const aMinutes = parseTimeToMinutes(aValue)
          const bMinutes = parseTimeToMinutes(bValue)

          // For holding time: arrow up = shortest time, arrow down = longest time
          return sortConfig.direction === 'asc' ? aMinutes - bMinutes : bMinutes - aMinutes
        }

        // Regular string comparison for other string fields
        const comparison = aValue.localeCompare(bValue)
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }

      // Handle arrays (tags)
      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        const aStr = aValue.join(', ')
        const bStr = bValue.join(', ')
        const comparison = aStr.localeCompare(bStr)
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }

      return 0
    })
  }

  return filtered
} 