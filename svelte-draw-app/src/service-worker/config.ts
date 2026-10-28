/** Pure constants shared by the service worker and its unit tests. */

/** workbox `maximumFileSizeToCacheInBytes: 2.3 * 1024 ** 2` */
export const MAX_PRECACHE_FILE_SIZE = Math.floor(2.3 * 1024 ** 2);

const DAY = 60 * 60 * 24;

export const PRECACHE_CACHE_PREFIX = "precache-";
export const EXPIRY_META_CACHE = "sw-expiry-meta";

/** Cache read by the editor (`App.restoreFileFromShare`): key `shared-file`. */
export const SHARE_TARGET_CACHE = "web-share-target";
export const SHARE_TARGET_KEY = "shared-file";
/** Query flag the editor looks for (`searchParams.has("web-share-target")`). */
export const SHARE_TARGET_QUERY = "web-share-target";
/** `share_target.action` in `static/manifest.webmanifest` (relative to base). */
export const SHARE_TARGET_PATH = "web-share-target";

export type RuntimeStrategy = "CacheFirst" | "StaleWhileRevalidate";

export interface RuntimeRule {
  /** key used for expiration bookkeeping, unique per rule */
  name: string;
  cacheName: string;
  strategy: RuntimeStrategy;
  maxEntries: number;
  maxAgeSeconds?: number;
  /** response statuses that may be stored (0 = opaque cross-origin) */
  statuses: readonly number[];
}

/**
 * Equivalent of the `runtimeCaching` entries in the old
 * `excalidraw-app/vite.config.mts` `VitePWA({ workbox })` block.
 */
export const RUNTIME_RULES = {
  // urlPattern ".+.woff2", CacheFirst, cache "fonts", 1000 entries, 90 days, [0, 200]
  woff2: {
    name: "woff2",
    cacheName: "fonts",
    strategy: "CacheFirst",
    maxEntries: 1000,
    maxAgeSeconds: 90 * DAY,
    statuses: [0, 200],
  },
  // urlPattern "fonts.css", StaleWhileRevalidate, cache "fonts", 50 entries
  fontsCss: {
    name: "fonts-css",
    cacheName: "fonts",
    strategy: "StaleWhileRevalidate",
    maxEntries: 50,
    statuses: [0, 200],
  },
  // urlPattern "locales/[^/]+.js", CacheFirst, cache "locales", 50 entries, 30 days
  locales: {
    name: "locales",
    cacheName: "locales",
    strategy: "CacheFirst",
    maxEntries: 50,
    maxAgeSeconds: 30 * DAY,
    statuses: [200],
  },
  // urlPattern "(.chunk-.+|CodeMirrorEditor-.+)\.js", CacheFirst, cache "chunk", 50, 90 days
  chunk: {
    name: "chunk",
    cacheName: "chunk",
    strategy: "CacheFirst",
    maxEntries: 50,
    maxAgeSeconds: 90 * DAY,
    statuses: [200],
  },
  // urlPattern "/assets/[^/]+\.js$", CacheFirst, cache "lazy-chunks", 200, 90 days
  lazyChunks: {
    name: "lazy-chunks",
    cacheName: "lazy-chunks",
    strategy: "CacheFirst",
    maxEntries: 200,
    maxAgeSeconds: 90 * DAY,
    statuses: [200],
  },
} as const satisfies Record<string, RuntimeRule>;

export const ALL_RUNTIME_RULES: readonly RuntimeRule[] =
  Object.values(RUNTIME_RULES);

export const precacheCacheName = (version: string) =>
  `${PRECACHE_CACHE_PREFIX}${version}`;

/** Caches that must survive an activation of the worker for `version`. */
export const isStaleCache = (cacheName: string, version: string) =>
  cacheName.startsWith(PRECACHE_CACHE_PREFIX) &&
  cacheName !== precacheCacheName(version);
