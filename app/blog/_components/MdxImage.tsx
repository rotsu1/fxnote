"use client"

import NextImage, { ImageProps } from "next/image"

function normalizeBase(base?: string) {
  if (!base) return ""
  return base.endsWith("/") ? base.slice(0, -1) : base
}

export default function MdxImage(props: ImageProps) {
  const base = normalizeBase(process.env.NEXT_PUBLIC_SUPABASE_BLOG_BASE)
  let src = props.src as string

  // If the MDX provides a bare filename like "image.webp",
  // prefix with the configured Supabase public base.
  if (typeof src === "string" && base && !src.startsWith("http") && !src.startsWith("/")) {
    src = `${base}/${src}`
  }

  return <NextImage {...props} src={src} />
}

