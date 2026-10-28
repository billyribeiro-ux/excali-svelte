import {
  ALL_RUNTIME_RULES,
  RUNTIME_RULES,
  isStaleCache,
  precacheCacheName,
} from "./config.ts";
import type { LazyChunkManifest } from "./lazy-chunks.ts";
import { classifyRequest, type RoutingContext } from "./routing.ts";

const lazy: LazyChunkManifest = {
  locales: ["_app/immutable/chunks/loc.js"],
  codemirror: ["_app/immutable/chunks/cm.js"],
  mermaid: ["_app/immutable/chunks/mm.js"],
  firebase: ["_app/immutable/chunks/fb.js"],
  chunk: ["_app/immutable/chunks/subset.js"],
  oversized: [],
};

const ctx = (base = ""): RoutingContext => ({
  origin: "https://draw.test",
  precached: new Set([
    `${base}/_app/immutable/entry/start.js`,
    `${base}/`,
    `${base}/manifest.webmanifest`,
  ]),
  lazy,
  immutablePrefix: `${base}/_app/immutable/`,
  navigationDenylist: [`${base}/web-share-target`],
});

const decide = (href: string, mode: RequestMode = "no-cors", c = ctx()) =>
  classifyRequest(new URL(href, "https://draw.test"), mode, c);

describe("classifyRequest", () => {
  it("serves precached urls from the precache", () => {
    expect(decide("/_app/immutable/entry/start.js").kind).toBe("precache");
    expect(decide("/manifest.webmanifest").kind).toBe("precache");
  });

  it("caches woff2 with the fonts rule (any origin)", () => {
    for (const href of [
      "/_app/immutable/assets/Excalifont-Regular.abc.woff2",
      "https://cdn.example.com/fonts/Virgil/Virgil-Regular.woff2",
    ]) {
      expect(decide(href)).toEqual({ kind: "runtime", rule: RUNTIME_RULES.woff2 });
    }
    expect(RUNTIME_RULES.woff2).toMatchObject({
      cacheName: "fonts",
      strategy: "CacheFirst",
      maxEntries: 1000,
      maxAgeSeconds: 7776000,
      statuses: [0, 200],
    });
  });

  it("uses stale-while-revalidate for fonts.css", () => {
    expect(decide("/fonts.css")).toEqual({
      kind: "runtime",
      rule: RUNTIME_RULES.fontsCss,
    });
    expect(decide("/myfonts.css").kind).toBe("ignore");
    expect(RUNTIME_RULES.fontsCss).toMatchObject({
      cacheName: "fonts",
      strategy: "StaleWhileRevalidate",
      maxEntries: 50,
    });
  });

  it("routes lazy chunks to their runtime caches", () => {
    const rule = (name: string) =>
      (decide(`/_app/immutable/chunks/${name}.js`) as { rule: unknown }).rule;
    expect(rule("loc")).toBe(RUNTIME_RULES.locales);
    expect(rule("cm")).toBe(RUNTIME_RULES.chunk);
    expect(rule("subset")).toBe(RUNTIME_RULES.chunk);
    expect(rule("mm")).toBe(RUNTIME_RULES.lazyChunks);
    expect(rule("fb")).toBe(RUNTIME_RULES.lazyChunks);
    expect(rule("unknown-dynamic")).toBe(RUNTIME_RULES.lazyChunks);
    expect(RUNTIME_RULES.locales).toMatchObject({
      cacheName: "locales",
      maxEntries: 50,
      maxAgeSeconds: 2592000,
    });
    expect(RUNTIME_RULES.chunk).toMatchObject({ maxEntries: 50, maxAgeSeconds: 7776000 });
  });

  it("respects a base path", () => {
    const c = ctx("/draw");
    expect(decide("/draw/_app/immutable/chunks/loc.js", "no-cors", c)).toEqual({
      kind: "runtime",
      rule: RUNTIME_RULES.locales,
    });
    expect(decide("/draw/_app/immutable/entry/start.js", "no-cors", c).kind).toBe(
      "precache",
    );
  });

  it("answers same-origin navigations with the shell, except denylisted", () => {
    expect(decide("/", "navigate").kind).toBe("precache");
    expect(decide("/?room=abc#key", "navigate").kind).toBe("precache");
    expect(decide("/some/deep/link", "navigate").kind).toBe("navigate");
    expect(decide("/web-share-target", "navigate").kind).toBe("ignore");
    expect(decide("https://other.test/", "navigate").kind).toBe("ignore");
  });

  it("ignores everything else", () => {
    expect(decide("/api/thing").kind).toBe("ignore");
    expect(decide("https://other.test/_app/immutable/chunks/loc.js").kind).toBe(
      "ignore",
    );
    expect(decide("/_app/immutable/assets/pic.png").kind).toBe("ignore");
  });
});

describe("cache naming", () => {
  it("scopes the precache to the version and only that is ever stale", () => {
    expect(precacheCacheName("123")).toBe("precache-123");
    expect(isStaleCache("precache-122", "123")).toBe(true);
    expect(isStaleCache("precache-123", "123")).toBe(false);
    for (const rule of ALL_RUNTIME_RULES) {
      expect(isStaleCache(rule.cacheName, "123")).toBe(false);
    }
    expect(isStaleCache("web-share-target", "123")).toBe(false);
  });
});
