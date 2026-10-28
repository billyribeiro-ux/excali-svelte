import { isExpired, planExpiration } from "./expiration.ts";

const DAY = 86_400_000;
const now = 100 * DAY;

describe("planExpiration", () => {
  it("evicts entries older than maxAgeSeconds", () => {
    const evict = planExpiration(
      [
        { url: "old", cachedAt: now - 31 * DAY },
        { url: "fresh", cachedAt: now - 29 * DAY },
      ],
      now,
      { maxEntries: 50, maxAgeSeconds: 30 * 86400 },
    );
    expect(evict).toEqual(["old"]);
  });

  it("evicts the oldest entries beyond maxEntries", () => {
    const evict = planExpiration(
      [
        { url: "a", cachedAt: now - 3 },
        { url: "b", cachedAt: now - 1 },
        { url: "c", cachedAt: now - 2 },
      ],
      now,
      { maxEntries: 2 },
    );
    expect(evict).toEqual(["a"]);
  });

  it("keeps everything without age limit while under maxEntries", () => {
    expect(
      planExpiration([{ url: "a", cachedAt: 0 }], now, { maxEntries: 1 }),
    ).toEqual([]);
  });
});

describe("isExpired", () => {
  it("never expires without maxAgeSeconds", () => {
    expect(isExpired(0, now, undefined)).toBe(false);
  });
  it("is exclusive at the boundary", () => {
    expect(isExpired(now - 1000, now, 1)).toBe(false);
    expect(isExpired(now - 1001, now, 1)).toBe(true);
  });
});
