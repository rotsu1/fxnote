"use client"

import { useMDXComponent } from "next-contentlayer/hooks"
import { Callout } from "./Callout"
import { Badge } from "./Badge"
import CopyCodeButton from "./CopyCodeButton"
import { ComponentType } from "react"
import Image from "next/image"

type Props = {
  code: string
}

const components = {
  Callout,
  Badge,
  Image,
}

export default function PostBody({ code }: Props) {
  const MDXContent = useMDXComponent(code)
  return (
    <article id="post-content" className="prose prose-zinc dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:shadow-none prose-code:before:content-none prose-code:after:content-none">
      <CopyCodeButton />
      <MDXContent components={components as Record<string, ComponentType<unknown>>} />
    </article>
  )
}
