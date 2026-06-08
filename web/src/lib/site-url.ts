/** Canonical public origin (no trailing slash). Used for metadataBase and absolute OG URLs. */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "https://debate.paperiq.ai";
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
