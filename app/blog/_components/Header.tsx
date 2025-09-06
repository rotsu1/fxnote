import Link from "next/link";
import Image from "next/image";

export default function Header() {
    return (
        <header className="px-4 lg:px-6 h-14 flex items-center sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
            <Link href="/" className="flex items-center justify-center group">
            <Image src="/logo.svg?height=30&width=30" width="30" height="30" alt="FXNote Logo" />
            <span className="ml-2 font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:to-cyan-500 transition-colors">FXNote</span>
            </Link>
        </header>
    )
};