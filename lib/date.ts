export function formatDateISO(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

export function formatDateLong(date: string | Date, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(d)
}

export function compareDescByDate(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime()
}

