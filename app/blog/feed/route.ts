import { allPosts } from "@/.contentlayer/generated"
import { absoluteUrl } from "@/lib/seo"

const SITE_TITLE = "FXNote Blog"
const SITE_DESCRIPTION = "Updates and articles from FXNote"

function getItems() {
  const prod = process.env.NODE_ENV === "production"
  return allPosts
    .filter((p) => (prod ? p.draft !== true : true))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function GET() {
  const base = absoluteUrl("")
  const posts = getItems()
  const itemsXml = posts
    .map((p) => {
      const url = absoluteUrl(p.url)
      const pub = new Date(p.date).toUTCString()
      const upd = p.updated ? new Date(p.updated).toUTCString() : pub
      return `\n      <item>\n        <title><![CDATA[${p.title}]]></title>\n        <link>${url}</link>\n        <guid>${url}</guid>\n        <pubDate>${pub}</pubDate>\n        <description><![CDATA[${p.description}]]></description>\n        <category>${(p.tags || []).join(', ')}</category>\n      </item>`
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${SITE_TITLE}</title>\n    <link>${base}/blog</link>\n    <description>${SITE_DESCRIPTION}</description>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${itemsXml}\n  </channel>\n</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
