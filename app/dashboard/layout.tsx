"use client"

import AuthGuard from "@/components/layout/AuthGuard";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  // Freemium: allow usage without overlay blocking UI
  return (
    <AuthGuard>
      <div className="relative flex h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="flex-grow md:overflow-y-auto">
          {children}
        </div>
      </div>
    </AuthGuard>
  )
}
