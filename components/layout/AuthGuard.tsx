"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const user = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // No blocking loading screen — render optimistically

  useEffect(() => {
    // Redirect unauthenticated users, but do not block rendering
    if (user === null) {
      router.push("/auth/login");
    }
  }, [user, router]);

  // After login, check subscription-based access for dashboard routes
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return; // not logged-in path handled below
      // Only guard dashboard pages here
      if (!pathname?.startsWith('/dashboard')) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch('/api/me/subscription-status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const j = await res.json();
        if (j.route === '/subscription') {
          router.replace('/subscription');
          return;
        }
        if (j.access === 'limited') {
          if (pathname !== '/dashboard/settings') {
            router.replace('/dashboard/settings');
          }
        }
      } finally {
        // no-op; we don't block UI
      }
    };
    checkAccess();
  }, [user, pathname, router]);

  // Render optimistically for logged-in or unknown state; redirect handles null
  if (user === null) return null;
  return <>{children}</>;
}
