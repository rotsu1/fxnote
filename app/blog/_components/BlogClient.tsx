"use client"

import { useEffect, useMemo, useState } from "react"
import PostCard from "./PostCard"
import type { Post } from "@/.contentlayer/generated"

export function SearchInput() {
  return (
    <input
      id="blog-search"
      type="search"
      placeholder="Search posts…"
      className="h-9 w-56 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-400"
      aria-label="Search posts"
    />
  )
}

export function ClientFilteredList({ initialPosts }: { initialPosts: Post[] }) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    const input = document.getElementById("blog-search") as HTMLInputElement | null
    if (!input) return
    const handler = () => setQuery(input.value)
    input.addEventListener("input", handler)
    return () => input.removeEventListener("input", handler)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return initialPosts
    return initialPosts.filter((p) => {
      const inTitle = p.title.toLowerCase().includes(q)
      const inTags = (p.tags || []).some((t) => t.toLowerCase().includes(q))
      return inTitle || inTags
    })
  }, [query, initialPosts])

  if (!filtered.length) {
    return <p className="text-sm text-muted-foreground">No posts found.</p>
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((p) => (
        <PostCard
          key={p._id}
          href={p.url}
          title={p.title}
          description={p.description}
          date={p.date}
          readingTime={p.readingTime}
          tags={p.tags}
          cover={p.cover || null}
        />
      ))}
    </div>
  )
}

export default {
  SearchInput,
  ClientFilteredList,
}

