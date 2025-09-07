import Link from "next/link"

const tags = ["テクニカル分析", "ファンダメンタルズ分析", "FX業者"]

const navItems = [
  ...tags.map((tag) => ({
    title: tag,
    href: `/blog?tag=${encodeURIComponent(tag)}`,
  })),
  { title: "記事一覧", href: "/blog" },
]

export default function NavBar() {
    return (
        <nav className="relative flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 py-6 mb-10 border border-border/40 rounded-xl bg-gradient-to-r from-emerald-50 via-background to-cyan-50 dark:from-emerald-900/10 dark:via-background dark:to-cyan-900/10 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(400px_200px_at_10%_10%,#10b981_0,transparent_60%),radial-gradient(400px_200px_at_90%_80%,#06b6d4_0,transparent_60%)]" />
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.title}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg group hover:shadow-sm"
            >
              <span className="relative z-10">{item.title}</span>
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 group-hover:w-3/4 transition-all duration-200" />
            </Link>
          ))}
        </nav>
    )
}
