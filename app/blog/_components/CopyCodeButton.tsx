"use client"

import { useEffect } from "react"

export default function CopyCodeButton() {
  useEffect(() => {
    const pres = Array.from(document.querySelectorAll<HTMLPreElement>("article pre"))
    pres.forEach((pre) => {
      if (pre.querySelector('[data-copy]')) return
      pre.classList.add("group", "relative")
      const btn = document.createElement("button")
      btn.textContent = "Copy"
      btn.setAttribute("data-copy", "")
      btn.className =
        "absolute right-2 top-2 rounded bg-zinc-800/80 text-zinc-100 px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-400"
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.textContent || ""
        try {
          await navigator.clipboard.writeText(code)
          btn.textContent = "Copied!"
          setTimeout(() => (btn.textContent = "Copy"), 1200)
        } catch {
          // ignore
        }
      })
      pre.appendChild(btn)
    })
  }, [])

  return null
}

