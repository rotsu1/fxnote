export const SITE_NAME = "FXNote";

// Reads from env with safe fallback for local/dev
export function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (envUrl) return envUrl
  // Vercel env fallbacks
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

export function absoluteUrl(path: string) {
  const base = getBaseUrl()
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

export const DEFAULT_OG_IMAGE = "/og.png"; // replace if you have a site-wide OG image

