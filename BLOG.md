Blog Setup and Usage

- Overview: Local MDX + Contentlayer + Shiki highlighting with accessible, SEO-friendly pages.

How to Add a Post

- Create a new file under `content/posts/*.mdx`.
- Include frontmatter fields: `title` (string), `date` (ISO), `updated` (optional ISO), `description` (string), `tags` (string[]), `draft` (boolean), `cover` (optional image path, e.g., `/blog/my-post/cover.png`).
- Add images under `public/blog/...` and reference them via absolute `/blog/...` paths.

Frontmatter Schema

- title: Required string
- date: Required ISO date, e.g., `"2025-09-01"`
- updated: Optional ISO date for last update
- description: Required string (used for SEO + RSS)
- tags: Required array of strings
- draft: Required boolean; if `true`, hidden in production
- cover: Optional string path to an image in `public/blog`

Draft Preview Behavior

- Draft posts (`draft: true`) are visible locally (`pnpm dev`) but excluded from production builds and RSS.

Custom MDX Components

- `<Callout type="info|success|warning|danger">` and `<Badge>` are available in MDX.

Commands

- Install: `pnpm install`
- Develop: `pnpm dev`
- Build: `pnpm build`

Notes

- RSS: Available at `/blog/rss.xml` (also `/blog/feed`).
- Pagination: 10 posts per page via `?page=1` query.
- Search: Lightweight client filter on title/tags (no external index).
- SEO: Uses Next metadata and canonical URLs. Open Graph/Twitter cards set per post.
- SSG: All pages are statically generated. Updating/adding MDX triggers Contentlayer rebuild on deploy (and locally during dev).

