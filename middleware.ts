import { NextRequest, NextResponse } from 'next/server';

// Guard dashboard routes server-side to avoid client-side flashes
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Read Supabase access token from cookie (client-side auth)
  const token = req.cookies.get('sb-access-token')?.value;

  // If not logged in, send to login
  if (!token) {
    const url = new URL('/auth/login', req.url);
    return NextResponse.redirect(url);
  }

  try {
    // Ask our API for the user's subscription access
    const apiUrl = new URL('/api/me/subscription-status', req.url);
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
      // Ensure middleware does not cache auth-specific result
      cache: 'no-store',
    });

    if (!res.ok) {
      // On failure, allow but client guard will still attempt redirect
      return NextResponse.next();
    }

    const j = await res.json();

    // Never subscribed → force subscription page
    if (j.route === '/subscription') {
      const url = new URL('/subscription', req.url);
      return NextResponse.redirect(url);
    }

    // Limited access → allow only settings within dashboard
    if (j.access === 'limited') {
      if (pathname !== '/dashboard/settings') {
        const url = new URL('/dashboard/settings', req.url);
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  } catch {
    // Fallback: allow request; client-side guard may still handle
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

