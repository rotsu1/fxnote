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
    first_name?: string
    last_name?: string
    timezone: string
    preferred_currency: string
    created_at?: string
    updated_at?: string
}

export interface Metric {
    key: string;
    title: string;
    format: (value: any) => string;
    color: (value: any) => string;
}
  
export interface KeyStatsGridProps {
    selectedYear: number | "指定しない";
    selectedMonth: number | "指定しない";
    selectedDay: number | "指定しない";
}