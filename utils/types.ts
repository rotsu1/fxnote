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
    entry: number | null
    exit: number | null
    lot?: number | null
    pips: number | null
    profit: number | null
    emotion: string[]
    holdingTime: number
    holdingDays?: number
    holdingHours?: number
    holdingMinutes?: number
    holdingSeconds?: number
    notes?: string
    tags: string[]
}

export interface Profile {
    id: string
    timezone: string
    preferred_currency: string
    created_at?: string
    updated_at?: string
}