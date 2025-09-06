import Link from "next/link";
export default function Footer() {
    return (
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
            <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} FXNote. 全ての権利を保有します。
            </p>
            <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                <Link href="/terms" className="text-xs hover:underline underline-offset-4">
        利用規約
        </Link>
        <Link href="/privacy" className="text-xs hover:underline underline-offset-4">
        プライバシーポリシー
        </Link>
    </nav>
</footer>
    )
}