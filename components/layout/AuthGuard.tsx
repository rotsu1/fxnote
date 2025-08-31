"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const user = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  useEffect(() => {
    // Once we know user is null or defined, loading is done
    if (user !== undefined) {
      setIsLoading(false);
      if (user === null) {
        router.push("/auth/login");
      }
    }
  }, [user, router]);

  // After login, check subscription-based access for dashboard routes
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return; // not logged-in path handled below
      // Only guard dashboard pages here
      if (!pathname?.startsWith('/dashboard')) return;
      setIsCheckingAccess(true);
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
        setIsCheckingAccess(false);
      }
    };
    checkAccess();
  }, [user, pathname, router]);

  if (isLoading || isCheckingAccess) {
    // Show loading indicator or blank while checking auth
    return <div>Loading...</div>;
  }

  // If user is logged in, render children
  if (user) {
    return <>{children}</>;
  }

  // If user is null, user will be redirected, so don't render anything
  return null;
}
