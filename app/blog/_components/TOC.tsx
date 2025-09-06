"use client"

import { useEffect, useState } from "react"

type TocItem = {
  id: string
  text: string
  level: number
}

type TocNode = TocItem & { children: TocNode[] }

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

  // Build a nested tree (h2 > h3 > h4)
  const buildTree = (flat: TocItem[]): TocNode[] => {
    const roots: TocNode[] = []
    const stack: TocNode[] = []
    for (const it of flat) {
      const node: TocNode = { ...it, children: [] }
      while (stack.length && stack[stack.length - 1].level >= node.level) {
        stack.pop()
      }
      if (stack.length === 0) {
        roots.push(node)
      } else {
        stack[stack.length - 1].children.push(node)
      }
      stack.push(node)
    }
    return roots
  }

  const tree = buildTree(items)

  const renderList = (nodes: TocNode[], prefix: number[] = []) => (
    <ol className="list-none pl-0 space-y-1">
      {nodes.map((n, idx) => {
        const current = idx + 1
        const numbers = [...prefix, current]
        const label = numbers.join(".")
        return (
          <li key={n.id} className="">
            <a
              href={`#${n.id}`}
              className="inline-flex gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-400 rounded"
            >
              <span className="shrink-0 tabular-nums text-zinc-500">{label}.</span>
              <span>{n.text}</span>
            </a>
            {n.children.length > 0 ? (
              <div className="mt-1 ml-6">
                {renderList(n.children, numbers)}
              </div>
            ) : null}
          </li>
        )
      })}
    </ol>
  )

  return (
    <nav aria-label="Table of contents" className="not-prose rounded-md border p-4 text-sm mb-6">
      <strong className="block mb-2">On this page</strong>
      {renderList(tree)}
    </nav>
  )
}
