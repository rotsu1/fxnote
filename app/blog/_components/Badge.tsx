import { PropsWithChildren } from "react"

export function Badge({ children }: PropsWithChildren) {
  return (
    <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-100 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700">
      {children}
    </span>
  )
}

