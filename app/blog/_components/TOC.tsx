"use client"

import { useEffect, useState } from "react"

type TocItem = {
  id: string
  text: string
  level: number
}

export default function TOC({ containerSelector = "#post-content" }: { containerSelector?: string }) {
  const [items, setItems] = useState<TocItem[]>([])

  useEffect(() => {
    const root = document.querySelector(containerSelector)
    if (!root) return
    const heads = Array.from(root.querySelectorAll<HTMLElement>("h2, h3, h4"))
    const mapped = heads
      .filter((h) => h.id)
      .map((h) => ({ id: h.id, text: h.textContent || "", level: Number(h.tagName.substring(1)) }))
    setItems(mapped)
  }, [containerSelector])

  if (items.length === 0) return null

  return (
    <nav aria-label="Table of contents" className="not-prose rounded-md border p-4 text-sm">
      <strong className="block mb-2">On this page</strong>
      <ul className="space-y-1">
        {items.map((item) => {
          const indentClass = item.level === 2 ? "" : item.level === 3 ? "ml-4" : "ml-8"
          return (
          <li key={item.id} className={indentClass}>
            <a
              href={`#${item.id}`}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-400 rounded"
            >
              {item.text}
            </a>
          </li>
        )})}
      </ul>
    </nav>
  )
}
