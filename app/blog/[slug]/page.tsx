import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { allPosts } from "@/.contentlayer/generated"
import PostBody from "../_components/PostBody"
import TOC from "../_components/TOC"
import { absoluteUrl } from "@/lib/seo"
import { formatDateISO, formatDateLong } from "@/lib/date"
import Header from "../_components/Header"
import NavBar from "../_components/NavBar"
import Footer from "@/components/ui/Footer"

export function generateStaticParams() {
  const prod = process.env.NODE_ENV === "production"
  return allPosts
    .filter((p) => (prod ? p.draft !== true : true))
    .map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = allPosts.find((p) => p.slug === slug)
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const prod = process.env.NODE_ENV === "production"
  const { slug } = await params
  const post = allPosts.find((p) => p.slug === slug)
  if (!post || (prod && post.draft)) notFound()

  return (
    <div className="relative">
      <Header />
      <div className="container max-w-6xl mx-auto px-4 py-6 mb-10">
        <NavBar />
        <div className="max-w-4xl mx-auto">
          <div>
            <Link href="/blog" className="text-sm text-muted-foreground hover:underline">← 記事一覧へ戻る</Link>
          </div>

          {post.cover ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border my-6">
              <Image src={post.cover} alt="" fill className="object-cover" sizes="100vw" priority={false} />
            </div>
          ) : null}

          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <time dateTime={formatDateISO(post.date)}>{formatDateLong(post.date, "ja-JP")}</time>
              {post.updated ? (
                <span>(更新日: {formatDateLong(post.updated, "ja-JP")})</span>
              ) : null}
              <span aria-hidden>•</span>
              <span>読み時間：約{post.readingTime} 分</span>
            </div>
          </div>

          <div className="mt-8">
            <div className="w-2/3 mx-auto">
              <TOC />
            </div>
            <PostBody code={post.body.code} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
