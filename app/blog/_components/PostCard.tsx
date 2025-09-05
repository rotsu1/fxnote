import Image from "next/image"
import Link from "next/link"
import { formatDateLong } from "@/lib/date"

type Props = {
  href: string
  title: string
  description: string
  date: string
  readingTime: number
  tags: string[]
  cover?: string | null
}

export default function PostCard({ href, title, description, date, readingTime, tags, cover }: Props) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border bg-background">
      {cover ? (
        <Link href={href} className="block aspect-[16/9] relative">
          <Image src={cover} alt="" fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" priority={false} />
        </Link>
      ) : null}
      <div className="p-4 sm:p-6">
        <div className="flex gap-2 text-xs text-muted-foreground">
          <time dateTime={date}>{formatDateLong(date)}</time>
          <span aria-hidden>•</span>
          <span>{readingTime} min read</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold">
          <Link href={href} className="hover:underline">
            {title}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}

