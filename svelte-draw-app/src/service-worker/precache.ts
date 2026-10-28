import { MAX_PRECACHE_FILE_SIZE } from "./config.ts";
import {
  LAZY_CATEGORIES,
  type LazyCategory,
  type LazyChunkManifest,
} from "./lazy-chunks.ts";

export interface ManifestEntry {
  path: string;
}

export type ExclusionReason =
  | LazyCategory
  | "oversized"
  | "font"
  | "not-precacheable";

export interface PrecachePlan {
  /** absolute pathnames (after `resolve`) to precache, deduplicated */
  urls: string[];
  excluded: { path: string; reason: ExclusionReason }[];
}

/** workbox default `globPatterns: ["**\/*.{js,css,html}"]`, plus static assets. */
const PRECACHE_IMMUTABLE_EXTENSION = /\.(?:js|css)$/;

/** Why `path` (relative to the base, as in `$app/manifest`) is not precached. */
export const exclusionReason = (
  path: string,
  lazy: LazyChunkManifest,
): ExclusionReason | null => {
  if (path.endsWith(".woff2")) return "font";
  for (const category of LAZY_CATEGORIES) {
    if (lazy[category].includes(path)) return category;
  }
  if (lazy.oversized.includes(path)) return "oversized";
  return null;
};

/** The lazy category a (relative) immutable file belongs to, if any. */
export const lazyCategoryOf = (
  path: string,
  lazy: LazyChunkManifest,
): LazyCategory | null => {
  for (const category of LAZY_CATEGORIES) {
    if (lazy[category].includes(path)) return category;
  }
  return null;
};

/**
 * Decide what goes into the precache.
 *
 * - `immutable` (Vite output): `.js`/`.css` only, minus fonts, locale chunks,
 *   mermaid, CodeMirror, Firebase, `*.chunk` and oversized files.
 * - `assets` (static dir): everything except oversized files.
 * - `prerendered`: the app shell and other prerendered pages.
 */
export const planPrecache = (
  input: {
    immutable: readonly ManifestEntry[];
    assets: readonly ManifestEntry[];
    prerendered: readonly ManifestEntry[];
  },
  lazy: LazyChunkManifest,
  resolve: (path: string) => string,
): PrecachePlan => {
  const urls = new Set<string>();
  const excluded: PrecachePlan["excluded"] = [];

  for (const { path } of input.immutable) {
    const reason = exclusionReason(path, lazy);
    if (reason) {
      excluded.push({ path, reason });
    } else if (!PRECACHE_IMMUTABLE_EXTENSION.test(path)) {
      excluded.push({ path, reason: "not-precacheable" });
    } else {
      urls.add(resolve(path));
    }
  }

  for (const { path } of input.assets) {
    if (lazy.oversized.includes(path)) {
      excluded.push({ path, reason: "oversized" });
    } else {
      urls.add(resolve(path));
    }
  }

  for (const { path } of input.prerendered) {
    urls.add(resolve(path));
  }

  return { urls: [...urls], excluded };
};

export const isOversized = (byteLength: number) =>
  byteLength > MAX_PRECACHE_FILE_SIZE;
