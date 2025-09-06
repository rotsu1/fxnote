import type { Metadata } from "next"
import Link from "next/link"
import { allPosts } from "@/.contentlayer/generated"
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
    <div className="relative">
      {/* Subtle finance-themed top gradient + divider */}
      <Header />
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <NavBar />
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              ブログ
            </h1>
            <p className="text-sm text-muted-foreground">テクニカル分析、ファンダメンタルズ分析、FX業者、新着記事などの情報を提供します。</p>
            <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
          </div>
          {/* Placeholder for future search; simple client-side filter below */}
          <div className="flex items-center gap-3">
            <BlogClient.SearchInput />
          </div>
        </div>

        <BlogClient.ClientFilteredList initialPosts={pagePosts} />

        <Pagination page={page} totalPages={totalPages} />
      </div>
    </div>
  )
}

import * as BlogClient from "./_components/BlogClient"
import NavBar from "./_components/NavBar"
import Header from "./_components/Header"

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  const prev = page > 1 ? page - 1 : null
  const next = page < totalPages ? page + 1 : null
  const mkHref = (p: number) => (p === 1 ? "/blog" : `/blog?page=${p}`)
  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Pagination">
      <Link
        aria-disabled={!prev}
        className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 bg-background hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-cyan-500/10 transition-colors"
        href={prev ? mkHref(prev) : "#"}
      >
        <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Previous</span>
      </Link>
      <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
      <Link
        aria-disabled={!next}
        className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 bg-background hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-cyan-500/10 transition-colors"
        href={next ? mkHref(next) : "#"}
      >
        <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Next</span>
      </Link>
    </nav>
  )
}
