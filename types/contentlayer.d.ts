declare module "contentlayer/generated" {
  export interface Post {
    _id: string
    _raw: { sourceFilePath: string; flattenedPath: string }
    title: string
    date: string
    updated?: string
    description: string
    tags: string[]
    draft: boolean
    cover?: string
    slug: string
    url: string
    readingTime: number
    body: { code: string; raw: string }
  }
  export const allPosts: Post[]
}

