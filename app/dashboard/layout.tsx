import AuthGuard from "@/components/layout/AuthGuard";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
                <div className="flex-grow md:overflow-y-auto">{children}</div>
            </div>
        </AuthGuard>
    )
}