import { MAX_PRECACHE_FILE_SIZE } from "./config.ts";
import { EMPTY_LAZY_CHUNKS, type LazyChunkManifest } from "./lazy-chunks.ts";
import { exclusionReason, isOversized, planPrecache } from "./precache.ts";

const lazy: LazyChunkManifest = {
  locales: ["_app/immutable/chunks/loc-fr.js"],
  codemirror: ["_app/immutable/chunks/cm.js"],
  mermaid: ["_app/immutable/chunks/mm1.js", "_app/immutable/chunks/mm2.js"],
  firebase: ["_app/immutable/chunks/fb.js"],
  chunk: ["_app/immutable/chunks/subset.js"],
  oversized: ["_app/immutable/chunks/huge.js", "huge-static.png"],
};

const resolve = (path: string) => `/${path}`;
const e = (...paths: string[]) => paths.map((path) => ({ path }));

describe("planPrecache", () => {
  const plan = planPrecache(
    {
      immutable: e(
        "_app/immutable/entry/start.js",
        "_app/immutable/chunks/app.js",
        "_app/immutable/assets/App.css",
        "_app/immutable/assets/Excalifont-Regular.abc.woff2",
        "_app/immutable/assets/image.png",
        ...lazy.locales,
        ...lazy.codemirror,
        ...lazy.mermaid,
        ...lazy.firebase,
        ...lazy.chunk,
        "_app/immutable/chunks/huge.js",
      ),
      assets: e("favicon.svg", "manifest.webmanifest", "huge-static.png"),
      prerendered: e("", "about"),
    },
    lazy,
    resolve,
  );

  it("precaches shell, entry js/css and static assets", () => {
    expect(plan.urls).toEqual([
      "/_app/immutable/entry/start.js",
      "/_app/immutable/chunks/app.js",
      "/_app/immutable/assets/App.css",
      "/favicon.svg",
      "/manifest.webmanifest",
      "/",
      "/about",
    ]);
  });

  it("excludes every lazy category, fonts and oversized files", () => {
    const reasons = Object.fromEntries(
      plan.excluded.map(({ path, reason }) => [path, reason]),
    );
    expect(reasons).toMatchObject({
      "_app/immutable/assets/Excalifont-Regular.abc.woff2": "font",
      "_app/immutable/chunks/loc-fr.js": "locales",
      "_app/immutable/chunks/cm.js": "codemirror",
      "_app/immutable/chunks/mm1.js": "mermaid",
      "_app/immutable/chunks/mm2.js": "mermaid",
      "_app/immutable/chunks/fb.js": "firebase",
      "_app/immutable/chunks/subset.js": "chunk",
      "_app/immutable/chunks/huge.js": "oversized",
      "huge-static.png": "oversized",
      "_app/immutable/assets/image.png": "not-precacheable",
    });
    for (const url of plan.urls) {
      expect(url).not.toMatch(/woff2|loc-fr|cm\.js|mm\d|fb\.js|subset|huge/);
    }
  });

  it("deduplicates urls", () => {
    const dup = planPrecache(
      { immutable: e("a.js", "a.js"), assets: [], prerendered: [] },
      EMPTY_LAZY_CHUNKS,
      resolve,
    );
    expect(dup.urls).toEqual(["/a.js"]);
  });
});

describe("exclusionReason / isOversized", () => {
  it("returns null for ordinary files", () => {
    expect(exclusionReason("_app/immutable/chunks/x.js", lazy)).toBeNull();
  });

  it("uses the 2.3 MiB limit from the old workbox config", () => {
    expect(MAX_PRECACHE_FILE_SIZE).toBe(2411724);
    expect(isOversized(MAX_PRECACHE_FILE_SIZE)).toBe(false);
    expect(isOversized(MAX_PRECACHE_FILE_SIZE + 1)).toBe(true);
  });
});
