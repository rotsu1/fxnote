import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { allPosts } from "@/.contentlayer/generated"
import PostCard from "./_components/PostCard"
import { compareDescByDate } from "@/lib/date"

import { absoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Blog",
  description: "Latest posts and updates.",
  alternates: { canonical: absoluteUrl("/blog") },
}

const PER_PAGE = 10

function getNonDraftPosts() {
  const prod = process.env.NODE_ENV === "production"
  return allPosts
    .filter((p) => (prod ? p.draft !== true : true))
    .sort((a, b) => compareDescByDate(a.date, b.date))
}

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

export default function BlogIndex({ searchParams }: PageProps) {
  const pageParam = Number((searchParams?.page as string) || 1)
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const posts = getNonDraftPosts()
  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE))
  const start = (page - 1) * PER_PAGE
  const end = start + PER_PAGE
  const pagePosts = posts.slice(start, end)

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-muted-foreground">Notes, updates, and engineering posts.</p>
        </div>
        {/* Placeholder for future search; simple client-side filter below */}
        <BlogClient.SearchInput />
      </div>

      <BlogClient.ClientFilteredList initialPosts={pagePosts} />

      <Pagination page={page} totalPages={totalPages} />
    </div>
  )
}

import * as BlogClient from "./_components/BlogClient"

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  const prev = page > 1 ? page - 1 : null
  const next = page < totalPages ? page + 1 : null
  const mkHref = (p: number) => (p === 1 ? "/blog" : `/blog?page=${p}`)
  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Pagination">
      <Link aria-disabled={!prev} className="px-3 py-1 rounded border text-sm disabled:opacity-50" href={prev ? mkHref(prev) : "#"}>
        Previous
      </Link>
      <span className="text-sm">Page {page} of {totalPages}</span>
      <Link aria-disabled={!next} className="px-3 py-1 rounded border text-sm disabled:opacity-50" href={next ? mkHref(next) : "#"}>
        Next
      </Link>
    </nav>
  )
}
