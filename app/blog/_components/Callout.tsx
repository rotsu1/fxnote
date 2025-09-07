"use client"

import { PropsWithChildren } from "react"
import { cn } from "@/lib/utils"
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, Pencil } from "lucide-react"

type CalloutType = "info" | "success" | "warning" | "danger" | "note"

const icons: Record<CalloutType, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertOctagon,
  note: Pencil,
}

export function Callout({
  type = "info",
  title,
  children,
}: PropsWithChildren<{ type?: CalloutType; title?: string }>) {
  const base = "rounded-xl border p-4 my-6"
  const styles: Record<CalloutType, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-100",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-100",
    warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-100",
    danger: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-900 dark:text-red-100",
    note: "bg-yellow-50 border-yellow-200 text-amber-900 dark:bg-yellow-950/30 dark:border-yellow-900 dark:text-amber-100",
  }

  const Icon = icons[type]

  return (
    <div className={cn(base, styles[type])}>
      {title && (
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <Icon className="h-5 w-5" />
          {title}
        </div>
      )}

      {/* 子要素が <ul> のときチェック風に見せる（任意） */}
      <div className="[&>ul]:space-y-2 [&>ul>li]:flex [&>ul>li]:gap-2">
        <div className="[&>ul>li::before]:content-['✔'] [&>ul>li::before]:text-amber-500 [&>ul>li::before]:mr-1">
          {children}
        </div>
      </div>
    </div>
  )
}
