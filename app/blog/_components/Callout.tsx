"use client"

import { PropsWithChildren } from "react"
import { cn } from "@/lib/utils"

type CalloutType = "info" | "success" | "warning" | "danger"

export function Callout({ type = "info", children }: PropsWithChildren<{ type?: CalloutType }>) {
  const base = "rounded-md border p-4 my-4"
  const styles: Record<CalloutType, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-100",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-100",
    warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-100",
    danger: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-900 dark:text-red-100",
  }
  return <div className={cn(base, styles[type])}>{children}</div>
}

