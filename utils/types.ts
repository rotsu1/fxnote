export interface Trade {
    id: number
    date: string
    time: string
    entryTime?: string
    exitTime?: string
    entryDate?: string
    exitDate?: string
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
    holdingSeconds?: number
    notes?: string
    tags: string[]
}