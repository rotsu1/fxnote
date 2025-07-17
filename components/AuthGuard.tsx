"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const user = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Once we know user is null or defined, loading is done
    if (user !== undefined) {
      setIsLoading(false);
      if (user === null) {
        router.push("/login");
      }
    }
  }, [user, router]);

  if (isLoading) {
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
