import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { allPosts } from "@/.contentlayer/generated"
import PostBody from "../_components/PostBody"
import TOC from "../_components/TOC"
import { absoluteUrl } from "@/lib/seo"
import { formatDateISO, formatDateLong } from "@/lib/date"

type PageProps = { params: { slug: string } }

export function generateStaticParams() {
  const prod = process.env.NODE_ENV === "production"
  return allPosts
    .filter((p) => (prod ? p.draft !== true : true))
    .map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = allPosts.find((p) => p.slug === params.slug)
  if (!post) return {}
  const url = absoluteUrl(post.url)
  const images = post.cover ? [{ url: post.cover }] : undefined
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images,
    },
  }
}

export default function BlogPostPage({ params }: PageProps) {
  const prod = process.env.NODE_ENV === "production"
  const post = allPosts.find((p) => p.slug === params.slug)
  if (!post || (prod && post.draft)) notFound()

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <nav className="mb-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:underline">← Back to Blog</Link>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <time dateTime={formatDateISO(post.date)}>{formatDateLong(post.date)}</time>
          {post.updated ? (
            <span>(Updated {formatDateLong(post.updated)})</span>
          ) : null}
          <span aria-hidden>•</span>
          <span>{post.readingTime} min read</span>
          {post.tags?.length ? (
            <>
              <span aria-hidden>•</span>
              <ul className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <li key={t} className="rounded-md border px-2 py-0.5 text-xs">{t}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </header>

      {post.cover ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border">
          <Image src={post.cover} alt="" fill className="object-cover" sizes="100vw" priority={false} />
        </div>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">
        <PostBody code={post.body.code} />
        <div className="lg:sticky lg:top-20 h-fit">
          <TOC />
        </div>
      </div>

      <footer className="mt-10">
        <Link href="/blog" className="text-sm text-muted-foreground hover:underline">← Back to Blog</Link>
      </footer>
    </div>
  )
}
