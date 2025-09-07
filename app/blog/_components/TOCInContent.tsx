"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import TOC from "./TOC"

/**
 * Renders the Table of Contents between the intro (h1/paragraphs)
 * and the first h2 within the post content. Uses a portal to inject
 * into the DOM before the first h2 under `#post-content`.
 */
export default function TOCInContent({ containerSelector = "#post-content" }: { containerSelector?: string }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const root = document.querySelector(containerSelector)
    if (!root) return
    const firstH2 = root.querySelector<HTMLElement>("h2")
    if (!firstH2) return
    // Create an anchor container and insert it before the first h2
    const anchor = document.createElement("div")
    anchor.setAttribute("data-toc-anchor", "")
    firstH2.parentElement?.insertBefore(anchor, firstH2)
    setTarget(anchor)

    return () => {
      // Cleanup on unmount
      if (anchor.parentElement) {
        anchor.parentElement.removeChild(anchor)
      }
    }
  }, [containerSelector])

  if (!target) return null

  return createPortal(
    <div className="w-2/3 mx-auto">
      <TOC containerSelector={containerSelector} />
    </div>,
    target
  )
}

