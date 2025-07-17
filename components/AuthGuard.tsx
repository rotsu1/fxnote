// components/AuthGuard.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; // update path as needed
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const user = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.replace("/login"); // redirect to login if not authenticated
    }
  }, [user, router]);

  // Avoid flicker: render nothing until auth is confirmed
  if (user === null) return null;

  return <>{children}</>;
}