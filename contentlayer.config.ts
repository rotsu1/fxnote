import { defineDocumentType, makeSource } from "contentlayer/source-files"
import rehypeSlug from "rehype-slug"
// import rehypeAutolinkHeadings from "rehype-autolink-headings"
// Types of some rehype plugins can mismatch depending on unified versions in the tree.
// Cast to any to keep config TS-safe while runtime works as expected.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import rehypePrettyCode from "rehype-pretty-code"
// remark-gfm appears to conflict with current unified versions in this project.
// It can be re-enabled after dependency alignment.
// import remarkGfm from "remark-gfm"

const computedReadingTime = (text: string): number => {
  const words = (text || "").trim().split(/\s+/).filter(Boolean)
  const minutes = words.length / 200
  return Math.max(1, Math.round(minutes))
}

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    updated: { type: "date", required: false },
    description: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" }, required: true },
    draft: { type: "boolean", required: true },
    cover: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace(/^posts\//, ""),
    },
    url: {
      type: "string",
      resolve: (doc) => `/blog/${doc._raw.flattenedPath.replace(/^posts\//, "")}`,
    },
    readingTime: {
      type: "number",
      resolve: (doc) => computedReadingTime(doc.body.raw),
    },
  },
}))

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post],
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [
      rehypeSlug as any,
      // [rehypeAutolinkHeadings as any, { behavior: "wrap" }] as any,
      [rehypePrettyCode as any, { theme: "github-dark-default", keepBackground: false }] as any,
    ] as any,
  },
})
