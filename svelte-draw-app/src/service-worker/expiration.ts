export interface ExpirationLimits {
  maxEntries: number;
  maxAgeSeconds?: number;
}

export interface TimestampedEntry {
  url: string;
  /** epoch milliseconds when the response was stored */
  cachedAt: number;
}

export const isExpired = (
  cachedAt: number,
  now: number,
  maxAgeSeconds: number | undefined,
) => maxAgeSeconds !== undefined && now - cachedAt > maxAgeSeconds * 1000;

/**
 * Which cached URLs to evict: everything older than `maxAgeSeconds`, then the
 * oldest entries beyond `maxEntries` (same semantics as workbox's
 * ExpirationPlugin, except recency is time of storing, not of last use).
 */
export const planExpiration = (
  entries: readonly TimestampedEntry[],
  now: number,
  limits: ExpirationLimits,
): string[] => {
  const evict: string[] = [];
  const alive: TimestampedEntry[] = [];

  for (const entry of entries) {
    if (isExpired(entry.cachedAt, now, limits.maxAgeSeconds)) {
      evict.push(entry.url);
    } else {
      alive.push(entry);
    }
  }

  alive.sort((a, b) => b.cachedAt - a.cachedAt);
  for (const entry of alive.slice(limits.maxEntries)) {
    evict.push(entry.url);
  }
  return evict;
};
